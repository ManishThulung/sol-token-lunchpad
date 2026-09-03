import { ParsedTrade } from "@/types/trade";
import { ApiV3PoolInfoStandardItemCpmm } from "@raydium-io/raydium-sdk-v2";
import { ParsedTransactionWithMeta } from "@solana/web3.js";
import Decimal from "decimal.js";

export async function parseSwapTransaction(
  tx: ParsedTransactionWithMeta,
  poolInfo: ApiV3PoolInfoStandardItemCpmm,
  solPriceUsd: Decimal,
): Promise<ParsedTrade> {
  if (!tx.meta) {
    throw new Error("Missing transaction meta");
  }

  const owner = tx.transaction.message.accountKeys[0].pubkey.toBase58();

  const pre = tx.meta.preTokenBalances ?? [];
  const post = tx.meta.postTokenBalances ?? [];

  console.log(JSON.stringify({ pre, post }), "pre post pre post");
  function getBalance(balances: typeof pre, mint: string): Decimal {
    const balance = balances.find((b) => b.owner === owner && b.mint === mint);

    return new Decimal(balance?.uiTokenAmount.uiAmountString ?? "0");
  }

  const preA = getBalance(pre, poolInfo.mintA.address);
  const postA = getBalance(post, poolInfo.mintA.address);

  const preB = getBalance(pre, poolInfo.mintB.address);
  const postB = getBalance(post, poolInfo.mintB.address);

  console.log(
    JSON.stringify({
      preA,
      postA,
      preB,
      postB,
    }),
    "pre post",
  );

  const deltaA = postA.minus(preA);
  const deltaB = postB.minus(preB);

  let amountIn: Decimal;
  let amountOut: Decimal;
  let tokenInMint: string;
  let tokenOutMint: string;
  let side: "BUY" | "SELL";

  if (deltaA.lt(0)) {
    amountIn = deltaA.abs();
    amountOut = deltaB;
    tokenInMint = poolInfo.mintA.address;
    tokenOutMint = poolInfo.mintB.address;
    side = "BUY";
  } else {
    amountIn = deltaB.abs();
    amountOut = deltaA;
    tokenInMint = poolInfo.mintB.address;
    tokenOutMint = poolInfo.mintA.address;
    side = "SELL";
  }

  const usdVolume =
    tokenInMint === poolInfo.mintA.address
      ? amountIn.mul(solPriceUsd)
      : amountOut.mul(solPriceUsd);

  // const usdVolume = tx.meta.innerInstructions

  const feeRate = new Decimal(poolInfo.feeRate).div(1_000_000);

  return {
    trader: owner,
    side,
    amountIn,
    amountOut,
    tokenInMint,
    tokenOutMint,
    feeAmount: amountIn.mul(feeRate),
    usdVolume,
    price: new Decimal(poolInfo.price),
    slot: BigInt(tx.slot),
    timestamp: new Date((tx.blockTime ?? Math.floor(Date.now() / 1000)) * 1000),
  };
}

export function containsRaydiumCpmmInstruction(
  tx: ParsedTransactionWithMeta,
  programId: string,
): boolean {
  const instructions = tx.transaction.message.instructions;

  return instructions.some((instruction) => {
    if ("programId" in instruction) {
      return instruction.programId.toString() === programId;
    }

    return false;
  });
}

interface VaultBalanceChange {
  vault: string;
  mint: string;
  preAmount: bigint;
  postAmount: bigint;
  delta: bigint;
  decimals: number;
}

export function getVaultBalanceChanges(
  tx: ParsedTransactionWithMeta,
  vaultA: string,
  vaultB: string,
): VaultBalanceChange[] {
  if (!tx.meta) {
    throw new Error("Transaction metadata missing");
  }

  const vaults = new Set([vaultA, vaultB]);

  const accountKeys = tx.transaction.message.accountKeys;

  const pre = new Map<
    string,
    {
      mint: string;
      amount: bigint;
      decimals: number;
    }
  >();

  const post = new Map<
    string,
    {
      mint: string;
      amount: bigint;
      decimals: number;
    }
  >();

  for (const balance of tx.meta.preTokenBalances ?? []) {
    const account = accountKeys[balance.accountIndex]?.pubkey.toString();

    if (!account || !vaults.has(account)) {
      continue;
    }

    pre.set(account, {
      mint: balance.mint,
      amount: BigInt(balance.uiTokenAmount.amount),
      decimals: balance.uiTokenAmount.decimals,
    });
  }

  for (const balance of tx.meta.postTokenBalances ?? []) {
    const account = accountKeys[balance.accountIndex]?.pubkey.toString();

    if (!account || !vaults.has(account)) {
      continue;
    }

    post.set(account, {
      mint: balance.mint,
      amount: BigInt(balance.uiTokenAmount.amount),
      decimals: balance.uiTokenAmount.decimals,
    });
  }

  return [vaultA, vaultB]
    .map((vault) => {
      const before = pre.get(vault);
      const after = post.get(vault);

      if (!before && !after) {
        return null;
      }

      const preAmount = before?.amount ?? BigInt(0);
      const postAmount = after?.amount ?? BigInt(0);

      return {
        vault,

        mint: after?.mint ?? before?.mint ?? "",

        preAmount,
        postAmount,

        delta: postAmount - preAmount,

        decimals: after?.decimals ?? before?.decimals ?? 0,
      };
    })
    .filter((value): value is VaultBalanceChange => value !== null);
}

export type PoolOperation =
  | "SWAP_A_TO_B"
  | "SWAP_B_TO_A"
  | "DEPOSIT"
  | "WITHDRAW"
  | "UNKNOWN";

export function classifyPoolOperation(
  deltaA: bigint,
  deltaB: bigint,
): PoolOperation {
  if (deltaA < BigInt(0) && deltaB > BigInt(0)) {
    return "SWAP_A_TO_B";
  }

  if (deltaA > BigInt(0) && deltaB < BigInt(0)) {
    return "SWAP_B_TO_A";
  }

  if (deltaA > BigInt(0) && deltaB > BigInt(0)) {
    return "DEPOSIT";
  }

  if (deltaA < BigInt(0) && deltaB < BigInt(0)) {
    return "WITHDRAW";
  }

  return "UNKNOWN";
}

export interface ParsedSwap {
  type: "SWAP";

  user: string;

  inputMint: string;
  inputAmountRaw: bigint;
  inputAmount: number;

  outputMint: string;
  outputAmountRaw: bigint;
  outputAmount: number;

  inputVault: string;
  outputVault: string;
}

function findSwapUser(tx: ParsedTransactionWithMeta): string {
  const signer = tx.transaction.message.accountKeys.find(
    (account) => account.signer,
  );

  if (!signer) {
    throw new Error("Could not find transaction signer");
  }

  return signer.pubkey.toString();
}

export function parseRaydiumSwap(
  tx: ParsedTransactionWithMeta,
  // pool: RaydiumCpmmPool,
  pool: any,
): ParsedSwap | null {
  if (!tx.meta) {
    return null;
  }

  if (!containsRaydiumCpmmInstruction(tx, pool.programId)) {
    return null;
  }

  const changes = getVaultBalanceChanges(tx, pool.vaultA, pool.vaultB);
  console.log(changes, "changeschangeschanges");

  if (changes.length !== 2) {
    return null;
  }

  const changeA = changes.find((x) => x.vault === pool.vaultA)!;

  const changeB = changes.find((x) => x.vault === pool.vaultB)!;

  const operation = classifyPoolOperation(changeA.delta, changeB.delta);

  if (operation !== "SWAP_A_TO_B" && operation !== "SWAP_B_TO_A") {
    return null;
  }

  let input;
  let output;

  if (operation === "SWAP_A_TO_B") {
    input = changeA;
    output = changeB;
  } else {
    input = changeB;
    output = changeA;
  }

  const user = findSwapUser(tx);

  return {
    type: "SWAP",

    user,

    inputMint: input.mint,
    inputAmountRaw: -input.delta,
    inputAmount: Number(-input.delta) / 10 ** input.decimals,

    outputMint: output.mint,
    outputAmountRaw: output.delta,
    outputAmount: Number(output.delta) / 10 ** output.decimals,

    inputVault: input.vault,
    outputVault: output.vault,
  };
}

export function normalizeRaydiumPool(data: {
  poolInfo: any;
  rpcData: any;
  // }): RaydiumCpmmPool {
}) {
  const { poolInfo, rpcData } = data;

  return {
    id: poolInfo.id,
    programId: poolInfo.programId,

    mintA: poolInfo.mintA.address,
    mintB: poolInfo.mintB.address,

    vaultA: rpcData.vaultA,
    vaultB: rpcData.vaultB,

    decimalsA: poolInfo.mintA.decimals,
    decimalsB: poolInfo.mintB.decimals,

    lpMint: poolInfo.lpMint.address,
    lpDecimals: poolInfo.lpMint.decimals,

    tradeFeeRate: poolInfo.config.tradeFeeRate,
    protocolFeeRate: poolInfo.config.protocolFeeRate,
    fundFeeRate: poolInfo.config.fundFeeRate,
  };
}
