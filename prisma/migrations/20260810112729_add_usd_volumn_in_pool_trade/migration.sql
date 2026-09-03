/*
  Warnings:

  - Added the required column `usdVolume` to the `PoolTrade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PoolTrade" ADD COLUMN     "usdVolume" DECIMAL(30,2) NOT NULL;
