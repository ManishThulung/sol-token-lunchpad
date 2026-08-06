/*
  Warnings:

  - Added the required column `configId` to the `LiquidityPool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpMintAddress` to the `LiquidityPool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpMintDecimals` to the `LiquidityPool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradeFeeRate` to the `LiquidityPool` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "LiquidityPool" ADD COLUMN     "configId" TEXT NOT NULL,
ADD COLUMN     "creatorWallet" TEXT,
ADD COLUMN     "lpMintAddress" TEXT NOT NULL,
ADD COLUMN     "lpMintDecimals" INTEGER NOT NULL,
ADD COLUMN     "tradeFeeRate" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "PoolMetrics" (
    "id" TEXT NOT NULL,
    "reserveA" DECIMAL(30,9) NOT NULL,
    "reserveB" DECIMAL(30,9) NOT NULL,
    "price" DECIMAL(30,12) NOT NULL,
    "liquidityUsd" DECIMAL(30,2) NOT NULL,
    "lpSupply" DECIMAL(30,9) NOT NULL,
    "lpPrice" DECIMAL(30,9) NOT NULL,
    "holderCount" INTEGER NOT NULL,
    "volume24h" DECIMAL(30,2) NOT NULL,
    "volume7d" DECIMAL(30,2) NOT NULL,
    "volume30d" DECIMAL(30,2) NOT NULL,
    "fees24h" DECIMAL(30,2) NOT NULL,
    "fees7d" DECIMAL(30,2) NOT NULL,
    "fees30d" DECIMAL(30,2) NOT NULL,
    "apr24h" DECIMAL(10,4) NOT NULL,
    "apr7d" DECIMAL(10,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "poolId" TEXT NOT NULL,

    CONSTRAINT "PoolMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolTrade" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "trader" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "amountIn" DECIMAL(30,9) NOT NULL,
    "amountOut" DECIMAL(30,9) NOT NULL,
    "tokenInMint" TEXT NOT NULL,
    "tokenOutMint" TEXT NOT NULL,
    "feeAmount" DECIMAL(30,9) NOT NULL,
    "price" DECIMAL(30,12) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "poolId" TEXT NOT NULL,

    CONSTRAINT "PoolTrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolMetrics_poolId_key" ON "PoolMetrics"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolTrade_signature_key" ON "PoolTrade"("signature");

-- AddForeignKey
ALTER TABLE "PoolMetrics" ADD CONSTRAINT "PoolMetrics_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolTrade" ADD CONSTRAINT "PoolTrade_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
