import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));

export async function getSolBalance(publicKey: PublicKey) {
  const address = new PublicKey(publicKey);
  const balance = await connection.getBalance(address);
  return balance / LAMPORTS_PER_SOL;
}

export async function transferSol(
  fromKeypair: Keypair,
  to: string,
  amount: number,
) {
  const transferTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(to),
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transferTransaction,
    [fromKeypair],
  );
  return signature;
}

import Decimal from "decimal.js";

type RaydiumPoolInfo = any;

// Replace this with your price oracle
async function getTokenUsdPrice(mint: string): Promise<Decimal> {
  // Example:
  // WSOL - fetch from Pyth / Jupiter
  // Your token - calculate from pool or use indexer
  if (mint === "So11111111111111111111111111111111111111112") {
    return new Decimal(180); // example SOL price
  }

  return new Decimal(0);
}

// export async function upsertLiquidityPool(pool: RaydiumPoolInfo) {
//   // -----------------------------
//   // Reserves
//   // -----------------------------
//   const reserveA = new Decimal(pool.mintAmountA);
//   const reserveB = new Decimal(pool.mintAmountB);

//   // -----------------------------
//   // Prices
//   // -----------------------------
//   const price = reserveB.gt(0) ? reserveA.div(reserveB) : new Decimal(0);

//   // -----------------------------
//   // LP supply
//   // -----------------------------
//   const lpSupply = new Decimal(pool.lpAmount).div(
//     new Decimal(10).pow(pool.lpMint.decimals),
//   );

//   // -----------------------------
//   // Token prices
//   // -----------------------------
//   const priceAUsd = await getTokenUsdPrice(pool.mintA.address);

//   const priceBUsd = await getTokenUsdPrice(pool.mintB.address);

//   // If token B has no oracle, derive from pool
//   const derivedPriceBUsd = priceBUsd.gt(0) ? priceBUsd : priceAUsd.mul(price);

//   // -----------------------------
//   // TVL
//   // -----------------------------
//   const liquidityUsd = reserveA
//     .mul(priceAUsd)
//     .add(reserveB.mul(derivedPriceBUsd));

//   // -----------------------------
//   // LP token price
//   // -----------------------------
//   const lpPrice = lpSupply.gt(0) ? liquidityUsd.div(lpSupply) : new Decimal(0);

//   // -----------------------------
//   // Existing metrics
//   // -----------------------------
//   const existing = await prisma.poolMetrics.findUnique({
//     where: {
//       poolId: pool.id,
//     },
//   });

//   const volume24h = new Decimal(existing?.volume24h ?? 0);

//   const volume7d = new Decimal(existing?.volume7d ?? 0);

//   const volume30d = new Decimal(existing?.volume30d ?? 0);

//   const fees24h = new Decimal(existing?.fees24h ?? 0);

//   const fees7d = new Decimal(existing?.fees7d ?? 0);

//   const fees30d = new Decimal(existing?.fees30d ?? 0);

//   const holderCount = existing?.holderCount ?? 1;

//   // -----------------------------
//   // APR
//   // -----------------------------
//   const apr24h = liquidityUsd.gt(0)
//     ? fees24h.mul(365).div(liquidityUsd).mul(100)
//     : new Decimal(0);

//   const apr7d = liquidityUsd.gt(0)
//     ? fees7d.div(7).mul(365).div(liquidityUsd).mul(100)
//     : new Decimal(0);

//   // -----------------------------
//   // Save everything
//   // -----------------------------
//   return prisma.$transaction([
//     prisma.liquidityPool.upsert({
//       where: {
//         poolId: pool.id,
//       },
//       create: {
//         lpMintAddress: pool.lpMint.address,
//         lpMintDecimals: pool.lpMint.decimals,

//         mintAAddress: pool.mintA.address,
//         mintAProgramId: pool.mintA.programId,
//         mintADecimals: pool.mintA.decimals,

//         mintBAddress: pool.mintB.address,
//         mintBProgramId: pool.mintB.programId,
//         mintBDecimals: pool.mintB.decimals,

//         tradeFeeRate: pool.config.tradeFeeRate,
//         configId: pool.config.id,

//         openedAt: new Date(Number(pool.openTime) * 1000),
//       },
//       update: {
//         tradeFeeRate: pool.config.tradeFeeRate,
//         updatedAt: new Date(),
//       },
//     }),

//     prisma.poolMetrics.upsert({
//       where: {
//         poolId: pool.id,
//       },
//       create: {
//         poolId: pool.id,

//         reserveA: reserveA.toFixed(9),
//         reserveB: reserveB.toFixed(9),

//         price: price.toFixed(12),

//         liquidityUsd: liquidityUsd.toFixed(2),

//         lpSupply: lpSupply.toFixed(9),
//         lpPrice: lpPrice.toFixed(9),

//         holderCount,

//         volume24h: volume24h.toFixed(2),
//         volume7d: volume7d.toFixed(2),
//         volume30d: volume30d.toFixed(2),

//         fees24h: fees24h.toFixed(2),
//         fees7d: fees7d.toFixed(2),
//         fees30d: fees30d.toFixed(2),

//         apr24h: apr24h.toFixed(4),
//         apr7d: apr7d.toFixed(4),
//       },
//       update: {
//         reserveA: reserveA.toFixed(9),
//         reserveB: reserveB.toFixed(9),

//         price: price.toFixed(12),

//         liquidityUsd: liquidityUsd.toFixed(2),

//         lpSupply: lpSupply.toFixed(9),
//         lpPrice: lpPrice.toFixed(9),

//         apr24h: apr24h.toFixed(4),
//         apr7d: apr7d.toFixed(4),

//         updatedAt: new Date(),
//       },
//     }),
//   ]);
// }
