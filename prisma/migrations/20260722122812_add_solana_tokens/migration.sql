-- CreateEnum
CREATE TYPE "SolanaTokenStatus" AS ENUM ('PENDING', 'CREATED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleteAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolanaToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "mintAddress" TEXT,
    "mintAuthority" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "metadataUri" TEXT,
    "revokeFreeze" BOOLEAN NOT NULL DEFAULT false,
    "status" "SolanaTokenStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "SolanaToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolanaToken_mintAddress_key" ON "SolanaToken"("mintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SolanaToken_metadataUri_key" ON "SolanaToken"("metadataUri");

-- AddForeignKey
ALTER TABLE "SolanaToken" ADD CONSTRAINT "SolanaToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
