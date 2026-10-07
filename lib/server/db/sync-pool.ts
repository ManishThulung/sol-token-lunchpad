import { getRaydium } from "@/lib/raydium";
import { subDays, subHours } from "date-fns";
import {
  normalizeRaydiumPool,
  parseRaydiumSwap,
  parseSwapTransaction,
} from "../swap-transaction";
import Decimal from "decimal.js";
import { ApiV3PoolInfoStandardItemCpmm } from "@raydium-io/raydium-sdk-v2";
import { ParsedTrade } from "@/types/trade";
import { prisma } from "@/lib/db";

type TransferCheckedInfo = {
  authority: string;
  destination: string;
  mint: string;
  source: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
  };
};

type TransferCheckedInstruction = {
  parsed: { info: TransferCheckedInfo; type: "transferChecked" };
  program: string;
  programId: string;
  stackHeight: number;
};

type InstructionBlock = {
  index: number;
  instructions: TransferCheckedInstruction[];
};

const convertFeeIntoPercentage = (fee: number) => {
  return (fee / 1000000) * 100;
};

const calculateLiquidity = (
  reserveA: number,
  reserveB: number,
  solUsdPrice: number,
) => {
  const tokenALiquidity = reserveA * solUsdPrice;
  const tokenBLiquidity = (reserveA / reserveB) * solUsdPrice * reserveB;
  return Decimal(tokenALiquidity + tokenBLiquidity);
};

const findBaseTokenTrade = (
  instructions: InstructionBlock[],
  baseTokenAddress: string,
) => {
  const baseTokenTx = instructions.find((instructions) =>
    instructions.instructions.find(
      (tx) => tx.parsed.info.mint === baseTokenAddress,
    ),
  );
  return baseTokenTx?.instructions[0];
};

const calculateFee = (
  volumn: number,
  feeRate: number,
  protocolFeeRate: number,
  fundFeeRate: number,
) => {
  const grossFeeInUsd = volumn * (convertFeeIntoPercentage(feeRate) / 100);
  const protocolFeeInUsd =
    grossFeeInUsd * (convertFeeIntoPercentage(protocolFeeRate) / 100);
  const fundFeeInUsd =
    grossFeeInUsd * (convertFeeIntoPercentage(fundFeeRate) / 100);
  const actualLPFeeInUsd = grossFeeInUsd - protocolFeeInUsd - fundFeeInUsd;
  return {
    grossFeeInUsd,
    protocolFeeInUsd,
    fundFeeInUsd,
    actualLPFeeInUsd,
  };
};

export async function syncPool(poolId: string, txId: string) {
  const raydium = await getRaydium();
  const connection = raydium.connection;

  // current pool snapshot
  const { poolInfo, rpcData } = await raydium.cpmm.getPoolInfoFromRpc(poolId);

  // detailed infor of what happened in the transaction.
  const tx = await connection.getParsedTransaction(txId, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  console.log(JSON.stringify(tx), "txtx");

  if (!tx) throw new Error("Transaction not found");

  // const poolInfo = {
  //   programId: "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb",
  //   id: "Aj3vqS6jvtrnbyZFP5HD77HSciHj6KWrHeyx3a8UHNHz",
  //   type: "Standard",
  //   lpMint: {
  //     chainId: 101,
  //     address: "HLx2bQJcqJvY5QRya1W6k6tnnjYzK7pkd5HjjFEv8P6M",
  //     programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //     logoURI: "",
  //     symbol: "",
  //     name: "",
  //     decimals: 9,
  //     tags: [],
  //     extensions: {},
  //   },
  //   lpPrice: 0,
  //   lpAmount: 316227766016,
  //   config: {
  //     id: "5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy",
  //     index: 0,
  //     protocolFeeRate: 120000,
  //     tradeFeeRate: 2500,
  //     fundFeeRate: 40000,
  //     createPoolFee: "150000000",
  //   },
  //   mintA: {
  //     chainId: 101,
  //     address: "So11111111111111111111111111111111111111112",
  //     programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //     logoURI: "",
  //     symbol: "",
  //     name: "",
  //     decimals: 9,
  //     tags: [],
  //     extensions: {},
  //   },
  //   mintB: {
  //     chainId: 101,
  //     address: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //     programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //     logoURI: "",
  //     symbol: "",
  //     name: "",
  //     decimals: 9,
  //     tags: [],
  //     extensions: {},
  //   },
  //   rewardDefaultInfos: [],
  //   rewardDefaultPoolInfos: "Ecosystem",
  //   price: 27558.69379990912,
  //   mintAmountA: 1.90498869,
  //   mintAmountB: 52500,
  //   feeRate: 2500,
  //   openTime: "1786198208",
  //   tvl: 0,
  //   burnPercent: 0,
  //   day: {
  //     volume: 0,
  //     volumeQuote: 0,
  //     volumeFee: 0,
  //     apr: 0,
  //     feeApr: 0,
  //     priceMin: 0,
  //     priceMax: 0,
  //     rewardApr: [],
  //   },
  //   week: {
  //     volume: 0,
  //     volumeQuote: 0,
  //     volumeFee: 0,
  //     apr: 0,
  //     feeApr: 0,
  //     priceMin: 0,
  //     priceMax: 0,
  //     rewardApr: [],
  //   },
  //   month: {
  //     volume: 0,
  //     volumeQuote: 0,
  //     volumeFee: 0,
  //     apr: 0,
  //     feeApr: 0,
  //     priceMin: 0,
  //     priceMax: 0,
  //     rewardApr: [],
  //   },
  //   pooltype: [],
  //   farmUpcomingCount: 0,
  //   farmOngoingCount: 0,
  //   farmFinishedCount: 0,
  //   feeOn: "",
  //   hasDynamicFee: false,
  //   launchMigratePool: false,
  //   tips: [],
  // };
  // const rpcData = {
  //   configId: "5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy",
  //   poolCreator: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //   vaultA: "gN9HY9S7jh2THdTHZg9ipp3ZxT2ACxBptMZqwXW94zL",
  //   vaultB: "vYoehGwJY5eqvx3PnNWsiZiCL58ThgcFkAfWfV18SRy",
  //   mintLp: "HLx2bQJcqJvY5QRya1W6k6tnnjYzK7pkd5HjjFEv8P6M",
  //   mintA: "So11111111111111111111111111111111111111112",
  //   mintB: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //   mintProgramA: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //   mintProgramB: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //   observationId: "4dYEFqTSCg4yeNSmNQYsfMqgFqC2a2HvyPzNxDdGaPjs",
  //   bump: 255,
  //   status: 0,
  //   lpDecimals: 9,
  //   mintDecimalA: 9,
  //   mintDecimalB: 9,
  //   lpAmount: "49a0a4c700",
  //   protocolFeesMintA: "00",
  //   protocolFeesMintB: "2cb41780",
  //   fundFeesMintA: "00",
  //   fundFeesMintB: "0ee6b280",
  //   openTime: "6a7738c0",
  //   epoch: "045d",
  //   feeOn: 0,
  //   enableCreatorFee: false,
  //   creatorFeesMintA: "00",
  //   creatorFeesMintB: "00",
  //   programId: "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb",
  //   baseReserve: "718bd212",
  //   quoteReserve: "2fbf603efe00",
  //   vaultAAmount: "718bd212",
  //   vaultBAmount: "2fbf9bd9c800",
  //   configInfo: {
  //     bump: 253,
  //     disableCreatePool: false,
  //     index: 0,
  //     tradeFeeRate: "09c4",
  //     protocolFeeRate: "01d4c0",
  //     fundFeeRate: "9c40",
  //     createPoolFee: "08f0d180",
  //     protocolOwner: "DRay33UmULQCeawH3dVpJfN3uqLj6Qtq4ymSRx2pAgGK",
  //     fundOwner: "DRay33UmULQCeawH3dVpJfN3uqLj6Qtq4ymSRx2pAgGK",
  //     creatorFeeRate: "09c4",
  //   },
  //   poolPrice: "27558.69379990912177",
  // };
  // const tx = {
  //   blockTime: 1786358972,
  //   meta: {
  //     computeUnitsConsumed: 23052,
  //     costUnits: 26289,
  //     err: null,
  //     fee: 17500,
  //     innerInstructions: [
  //       {
  //         index: 4,
  //         instructions: [
  //           {
  //             parsed: {
  //               info: {
  //                 authority: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //                 destination: "vYoehGwJY5eqvx3PnNWsiZiCL58ThgcFkAfWfV18SRy",
  //                 mint: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //                 source: "43cwAVjkCu9h1hRvGojNycg2pjBk4eEyUVUuj3ciRv9o",
  //                 tokenAmount: {
  //                   amount: "2500000000000",
  //                   decimals: 9,
  //                   uiAmount: 2500,
  //                   uiAmountString: "2500",
  //                 },
  //               },
  //               type: "transferChecked",
  //             },
  //             program: "spl-token",
  //             programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //             stackHeight: 2,
  //           },
  //           {
  //             parsed: {
  //               info: {
  //                 authority: "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //                 destination: "7WyN8nhBn7Ux2hSEkv4cT8t3H8jo9G4N4EcPyiffYqmd",
  //                 mint: "So11111111111111111111111111111111111111112",
  //                 source: "gN9HY9S7jh2THdTHZg9ipp3ZxT2ACxBptMZqwXW94zL",
  //                 tokenAmount: {
  //                   amount: "95011310",
  //                   decimals: 9,
  //                   uiAmount: 0.09501131,
  //                   uiAmountString: "0.09501131",
  //                 },
  //               },
  //               type: "transferChecked",
  //             },
  //             program: "spl-token",
  //             programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //             stackHeight: 2,
  //           },
  //         ],
  //       },
  //     ],
  //     logMessages: [
  //       "Program ComputeBudget111111111111111111111111111111 invoke [1]",
  //       "Program ComputeBudget111111111111111111111111111111 success",
  //       "Program ComputeBudget111111111111111111111111111111 invoke [1]",
  //       "Program ComputeBudget111111111111111111111111111111 success",
  //       "Program 11111111111111111111111111111111 invoke [1]",
  //       "Program 11111111111111111111111111111111 success",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 145 of 249550 compute units",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
  //       "Program DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb invoke [1]",
  //       "Program log: Instruction: SwapBaseInput",
  //       "Program data: QMbN6CYIceKQfuMhwdLSD8YRjFg+5RX3cAFUOHZaAbtvkklejL5gnQAgPYh5LQAAAJQ1dwAAAAAAqJwTRgIAAO7BqQUAAAAAAAAAAAAAAAAAAAAAAAAAAAHJBoboKsiw8dma/PlJz4eYuSmW+h3wO2ET9vHTy8VK7gabiFf+q4GE+2h/Y0YYwDXaxDncGus7VZig8AAAAAABgG6HdAEAAAAAAAAAAAAAAAE=",
  //       "Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]",
  //       "Program log: Instruction: TransferChecked",
  //       "Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb consumed 2442 of 233372 compute units",
  //       "Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 112 of 228523 compute units",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
  //       "Program DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb consumed 22339 of 249405 compute units",
  //       "Program DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb success",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 118 of 227066 compute units",
  //       "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
  //     ],
  //     postBalances: [
  //       5695648730, 0, 5324400, 2074080, 2039280, 1907027970, 29252880, 1, 1,
  //       15367267856, 1141440, 3939360, 1481291460425, 1009200, 169590903127,
  //       2533440, 1159846,
  //     ],
  //     postTokenBalances: [
  //       {
  //         accountIndex: 3,
  //         mint: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //         owner: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //         programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //         uiTokenAmount: {
  //           amount: "48500000000000",
  //           decimals: 9,
  //           uiAmount: 48500,
  //           uiAmountString: "48500",
  //         },
  //       },
  //       {
  //         accountIndex: 4,
  //         mint: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //         owner: "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //         programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //         uiTokenAmount: {
  //           amount: "52500000000000",
  //           decimals: 9,
  //           uiAmount: 52500,
  //           uiAmountString: "52500",
  //         },
  //       },
  //       {
  //         accountIndex: 5,
  //         mint: "So11111111111111111111111111111111111111112",
  //         owner: "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //         programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //         uiTokenAmount: {
  //           amount: "1904988690",
  //           decimals: 9,
  //           uiAmount: 1.90498869,
  //           uiAmountString: "1.90498869",
  //         },
  //       },
  //     ],
  //     preBalances: [
  //       5600654920, 0, 5324400, 2074080, 2039280, 2002039280, 29252880, 1, 1,
  //       15367267856, 1141440, 3939360, 1481291460425, 1009200, 169590903127,
  //       2533440, 1159846,
  //     ],
  //     preTokenBalances: [
  //       {
  //         accountIndex: 3,
  //         mint: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //         owner: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //         programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //         uiTokenAmount: {
  //           amount: "51000000000000",
  //           decimals: 9,
  //           uiAmount: 51000,
  //           uiAmountString: "51000",
  //         },
  //       },
  //       {
  //         accountIndex: 4,
  //         mint: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //         owner: "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //         programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //         uiTokenAmount: {
  //           amount: "50000000000000",
  //           decimals: 9,
  //           uiAmount: 50000,
  //           uiAmountString: "50000",
  //         },
  //       },
  //       {
  //         accountIndex: 5,
  //         mint: "So11111111111111111111111111111111111111112",
  //         owner: "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //         programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //         uiTokenAmount: {
  //           amount: "2000000000",
  //           decimals: 9,
  //           uiAmount: 2,
  //           uiAmountString: "2",
  //         },
  //       },
  //     ],
  //     rewards: [],
  //     status: {
  //       Ok: null,
  //     },
  //   },
  //   slot: 482620807,
  //   transaction: {
  //     message: {
  //       accountKeys: [
  //         {
  //           pubkey: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //           signer: true,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "7WyN8nhBn7Ux2hSEkv4cT8t3H8jo9G4N4EcPyiffYqmd",
  //           signer: false,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "Aj3vqS6jvtrnbyZFP5HD77HSciHj6KWrHeyx3a8UHNHz",
  //           signer: false,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "43cwAVjkCu9h1hRvGojNycg2pjBk4eEyUVUuj3ciRv9o",
  //           signer: false,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "vYoehGwJY5eqvx3PnNWsiZiCL58ThgcFkAfWfV18SRy",
  //           signer: false,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "gN9HY9S7jh2THdTHZg9ipp3ZxT2ACxBptMZqwXW94zL",
  //           signer: false,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "4dYEFqTSCg4yeNSmNQYsfMqgFqC2a2HvyPzNxDdGaPjs",
  //           signer: false,
  //           source: "transaction",
  //           writable: true,
  //         },
  //         {
  //           pubkey: "ComputeBudget111111111111111111111111111111",
  //           signer: false,
  //           source: "transaction",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "11111111111111111111111111111111",
  //           signer: false,
  //           source: "transaction",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //           signer: false,
  //           source: "transaction",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb",
  //           signer: false,
  //           source: "transaction",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //           signer: false,
  //           source: "transaction",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "So11111111111111111111111111111111111111112",
  //           signer: false,
  //           source: "lookupTable",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "SysvarRent111111111111111111111111111111111",
  //           signer: false,
  //           source: "lookupTable",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //           signer: false,
  //           source: "lookupTable",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy",
  //           signer: false,
  //           source: "lookupTable",
  //           writable: false,
  //         },
  //         {
  //           pubkey: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //           signer: false,
  //           source: "lookupTable",
  //           writable: false,
  //         },
  //       ],
  //       addressTableLookups: [
  //         {
  //           accountKey: "EFhMuDw1PKEuckuFRW9PavNfTH4LKP5uKHgyXDmWpFCq",
  //           readonlyIndexes: [29, 25, 32, 16, 22],
  //           writableIndexes: [],
  //         },
  //       ],
  //       instructions: [
  //         {
  //           accounts: [],
  //           data: "3Sy41WEwNLnT",
  //           programId: "ComputeBudget111111111111111111111111111111",
  //           stackHeight: 1,
  //         },
  //         {
  //           accounts: [],
  //           data: "HnkkG7",
  //           programId: "ComputeBudget111111111111111111111111111111",
  //           stackHeight: 1,
  //         },
  //         {
  //           parsed: {
  //             info: {
  //               base: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //               lamports: 2039280,
  //               newAccount: "7WyN8nhBn7Ux2hSEkv4cT8t3H8jo9G4N4EcPyiffYqmd",
  //               owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //               seed: "A6wgPN6Fpvs7skJVQaKtzvE8PrkzGxXV",
  //               source: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //               space: 165,
  //             },
  //             type: "createAccountWithSeed",
  //           },
  //           program: "system",
  //           programId: "11111111111111111111111111111111",
  //           stackHeight: 1,
  //         },
  //         {
  //           parsed: {
  //             info: {
  //               account: "7WyN8nhBn7Ux2hSEkv4cT8t3H8jo9G4N4EcPyiffYqmd",
  //               mint: "So11111111111111111111111111111111111111112",
  //               owner: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //               rentSysvar: "SysvarRent111111111111111111111111111111111",
  //             },
  //             type: "initializeAccount",
  //           },
  //           program: "spl-token",
  //           programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //           stackHeight: 1,
  //         },
  //         {
  //           accounts: [
  //             "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //             "CXniRufdq5xL8t8jZAPxsPZDpuudwuJSPWnbcD5Y5Nxq",
  //             "5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy",
  //             "Aj3vqS6jvtrnbyZFP5HD77HSciHj6KWrHeyx3a8UHNHz",
  //             "43cwAVjkCu9h1hRvGojNycg2pjBk4eEyUVUuj3ciRv9o",
  //             "7WyN8nhBn7Ux2hSEkv4cT8t3H8jo9G4N4EcPyiffYqmd",
  //             "vYoehGwJY5eqvx3PnNWsiZiCL58ThgcFkAfWfV18SRy",
  //             "gN9HY9S7jh2THdTHZg9ipp3ZxT2ACxBptMZqwXW94zL",
  //             "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //             "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //             "EXiikDkNei3ciSNcG82YYi2JAX5yQ6rWqtcdWxDkPLVB",
  //             "So11111111111111111111111111111111111111112",
  //             "4dYEFqTSCg4yeNSmNQYsfMqgFqC2a2HvyPzNxDdGaPjs",
  //           ],
  //           data: "E73fXHPWvSQzdSbRx5RPLGSe9TzEi7yZ1",
  //           programId: "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb",
  //           stackHeight: 1,
  //         },
  //         {
  //           parsed: {
  //             info: {
  //               account: "7WyN8nhBn7Ux2hSEkv4cT8t3H8jo9G4N4EcPyiffYqmd",
  //               destination: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //               owner: "9PC2pb49KN4aBXzKtR2u6kDHpBTbfAwxqAovnMY3qh51",
  //             },
  //             type: "closeAccount",
  //           },
  //           program: "spl-token",
  //           programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  //           stackHeight: 1,
  //         },
  //       ],
  //       recentBlockhash: "8HgrCzpjU4KwpZ37wUmnubejzbHZjMcgPzuGBMJGTJXo",
  //     },
  //     signatures: [
  //       "3tZNpezHYzkqnnsHEGUsNj25C4h4nWKeRL97qEnDTTZrrNjdj5sDZKJTb2A6QHwqCnri1DwiaLps9i9pMv8x8VNt",
  //     ],
  //   },
  //   transactionIndex: 23,
  //   version: 0,
  // };

  const pool = normalizeRaydiumPool({ poolInfo, rpcData });

  // parse trade
  const trade: any = await parseSwapTransaction(tx, poolInfo, new Decimal(180));
  trade.signature = txId;
  console.log(trade, "tradetrade");

  const totalLiquidityUsd = calculateLiquidity(
    poolInfo.mintAmountA,
    poolInfo.mintAmountB,
    180,
  );
  const baseTokenTrade = findBaseTokenTrade(
    tx?.meta?.innerInstructions as any,
    poolInfo.mintA.address,
  );
  const tradeVolumeInUsd = baseTokenTrade
    ? baseTokenTrade.parsed.info.tokenAmount.uiAmount * 180
    : 0;

  const fee = calculateFee(
    tradeVolumeInUsd,
    poolInfo.config.tradeFeeRate,
    poolInfo.config.protocolFeeRate,
    poolInfo.config.fundFeeRate,
  );

  const swap = parseRaydiumSwap(tx, pool);
  console.log(
    { swap, tradeVolumeInUsd, totalLiquidityUsd, fee },
    "{swap, tradeVolumeInUsd, totalLiquidityUsd}",
  );
  return;
  // update database
  await updatePoolDatabase({
    totalLiquidityUsd,
    tradeVolumeInUsd: Decimal(tradeVolumeInUsd),
    poolId,
    poolInfo,
    trade,
    holderCount: 1,
  });
}

export async function updatePoolDatabase({
  totalLiquidityUsd,
  tradeVolumeInUsd,
  poolId,
  poolInfo,
  trade,
  holderCount,
}: {
  totalLiquidityUsd: Decimal;
  tradeVolumeInUsd: Decimal;
  poolId: string;
  poolInfo: ApiV3PoolInfoStandardItemCpmm;
  trade: ParsedTrade & { signature: string };
  holderCount: number;
}) {
  const reserveA = new Decimal(poolInfo.mintAmountA);
  const reserveB = new Decimal(poolInfo.mintAmountB);

  const price = new Decimal(poolInfo.price);

  const lpSupply = new Decimal(poolInfo.lpAmount).div(
    new Decimal(10).pow(poolInfo.lpMint.decimals),
  );

  // const liquidityUsd = trade.usdVolume.mul(2);

  const lpPrice = lpSupply.gt(0)
    ? totalLiquidityUsd.div(lpSupply)
    : new Decimal(0);

  await prisma.$transaction(async (db) => {
    await db.poolTrade.upsert({
      where: {
        signature: trade.signature ?? "",
      },
      create: {
        amountIn: trade.amountIn.toFixed(9),
        amountOut: trade.amountOut.toFixed(9),
        feeAmount: trade.feeAmount.toFixed(9),
        poolId,
        price: trade.price.toFixed(12),
        side: trade.side,
        signature: trade.signature ?? "",
        slot: trade.slot,
        timestamp: trade.timestamp,
        tokenInMint: trade.tokenInMint,
        tokenOutMint: trade.tokenOutMint,
        trader: trade.trader,
        usdVolume: tradeVolumeInUsd.toFixed(2),
      },
      update: {},
    });

    const now = new Date();

    const [v24, v7, v30] = await Promise.all([
      db.poolTrade.aggregate({
        where: {
          poolId,
          timestamp: {
            gte: subHours(now, 24),
          },
        },
        _sum: {
          usdVolume: true,
        },
      }),
      db.poolTrade.aggregate({
        where: {
          poolId,
          timestamp: {
            gte: subDays(now, 7),
          },
        },
        _sum: {
          usdVolume: true,
        },
      }),
      db.poolTrade.aggregate({
        where: {
          poolId,
          timestamp: {
            gte: subDays(now, 30),
          },
        },
        _sum: {
          usdVolume: true,
        },
      }),
    ]);

    const volume24h = new Decimal(v24._sum.usdVolume ?? 0);
    const volume7d = new Decimal(v7._sum.usdVolume ?? 0);
    const volume30d = new Decimal(v30._sum.usdVolume ?? 0);

    const feeRate = new Decimal(poolInfo.feeRate).div(1_000_000);

    const fees24h = volume24h.mul(feeRate);
    const fees7d = volume7d.mul(feeRate);
    const fees30d = volume30d.mul(feeRate);

    const apr24h = tradeVolumeInUsd.gt(0)
      ? fees24h.div(totalLiquidityUsd).mul(365).mul(100)
      : new Decimal(0);

    const apr7d = totalLiquidityUsd.gt(0)
      ? fees7d.div(totalLiquidityUsd).div(7).mul(365).mul(100)
      : new Decimal(0);

    await db.poolMetrics.upsert({
      where: { poolId },
      create: {
        poolId,
        reserveA: reserveA.toFixed(9),
        reserveB: reserveB.toFixed(9),
        price: price.toFixed(12),
        liquidityUsd: totalLiquidityUsd.toFixed(2),
        lpSupply: lpSupply.toFixed(9),
        lpPrice: lpPrice.toFixed(9),
        holderCount,
        volume24h: volume24h.toFixed(2),
        volume7d: volume7d.toFixed(2),
        volume30d: volume30d.toFixed(2),
        fees24h: fees24h.toFixed(2),
        fees7d: fees7d.toFixed(2),
        fees30d: fees30d.toFixed(2),
        apr24h: apr24h.toFixed(4),
        apr7d: apr7d.toFixed(4),
      },
      update: {
        reserveA: reserveA.toFixed(9),
        reserveB: reserveB.toFixed(9),
        price: price.toFixed(12),
        liquidityUsd: totalLiquidityUsd.toFixed(2),
        lpSupply: lpSupply.toFixed(9),
        lpPrice: lpPrice.toFixed(9),
        holderCount,
        volume24h: volume24h.toFixed(2),
        volume7d: volume7d.toFixed(2),
        volume30d: volume30d.toFixed(2),
        fees24h: fees24h.toFixed(2),
        fees7d: fees7d.toFixed(2),
        fees30d: fees30d.toFixed(2),
        apr24h: apr24h.toFixed(4),
        apr7d: apr7d.toFixed(4),
      },
    });
  });
}
