import { prisma } from "@/lib/db";
import Decimal from "decimal.js";
import { NextRequest, NextResponse } from "next/server";

type Token = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: string;
  mintAuthority: string | null;
  metadataUri: string;
  imageUrl: string | null;
};

type Input = {
  mintA: Token;
  mintB: Token;
  poolId: string;
  lpMintAddress: string;
  lpMintDecimals: number;
  tradeFeeRate: number;
  configId: string;
  poolMintAmountA: number;
  poolMintAmountB: number;
  lpAmount: number;
  priceAUsd: string;
  priceBUsd: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Input;
    const {
      mintA,
      mintB,
      poolId,
      lpMintAddress,
      lpMintDecimals,
      tradeFeeRate,
      configId,
      poolMintAmountA,
      poolMintAmountB,
      lpAmount,
      priceAUsd,
      priceBUsd,
    } = body;

    if (!mintA || !mintB || !poolId) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing",
        },
        { status: 400 },
      );
    }

    if (mintA.mint === mintB.mint) {
      return NextResponse.json(
        {
          success: false,
          message: "Mint A and Mint B must be different",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Reserves
    // -----------------------------
    const reserveA = new Decimal(poolMintAmountA);
    const reserveB = new Decimal(poolMintAmountB);

    // -----------------------------
    // Prices
    // -----------------------------
    const price = reserveB.gt(0) ? reserveA.div(reserveB) : new Decimal(0);

    // -----------------------------
    // LP supply
    // -----------------------------
    const lpSupply = new Decimal(lpAmount).div(
      new Decimal(10).pow(lpMintDecimals),
    );

    // -----------------------------
    // Token prices
    // -----------------------------
    // const priceAUsd = await getTokenUsdPrice(mintA.mint);

    // const priceBUsd = await getTokenUsdPrice(mintB.mint);

    // If token B has no oracle, derive from pool
    const derivedPriceBUsd = new Decimal(priceBUsd).gt(0)
      ? new Decimal(priceBUsd)
      : new Decimal(priceAUsd).mul(price);

    // -----------------------------
    // TVL
    // -----------------------------
    const liquidityUsd = reserveA
      .mul(priceAUsd)
      .add(reserveB.mul(derivedPriceBUsd));

    // -----------------------------
    // LP token price
    // -----------------------------
    const lpPrice = lpSupply.gt(0)
      ? liquidityUsd.div(lpSupply)
      : new Decimal(0);

    // const existing = await prisma.poolMetrics.findUnique({
    //   where: {
    //     poolId,
    //   },
    // });

    const existing: any = null;

    const volume24h = new Decimal(existing?.volume24h ?? 0);

    const volume7d = new Decimal(existing?.volume7d ?? 0);

    const volume30d = new Decimal(existing?.volume30d ?? 0);

    const fees24h = new Decimal(existing?.fees24h ?? 0);

    const fees7d = new Decimal(existing?.fees7d ?? 0);

    const fees30d = new Decimal(existing?.fees30d ?? 0);

    const holderCount = existing?.holderCount ?? 1;

    // -----------------------------
    // APR
    // -----------------------------
    const apr24h = liquidityUsd.gt(0)
      ? fees24h.mul(365).div(liquidityUsd).mul(100)
      : new Decimal(0);

    const apr7d = liquidityUsd.gt(0)
      ? fees7d.div(7).mul(365).div(liquidityUsd).mul(100)
      : new Decimal(0);

    const pool = await prisma.$transaction(
      async (tx) => {
        // Create or get token A
        await tx.token.upsert({
          where: { id: mintA.mint },
          update: {
            name: mintA.name,
            symbol: mintA.symbol,
            decimals: mintA.decimals,
            mintAuthority: mintA.mintAuthority,
            metadataUri: mintA.metadataUri,
            imageUrl: mintA.imageUrl,
          },
          create: {
            id: mintA.mint,
            name: mintA.name,
            symbol: mintA.symbol,
            decimals: mintA.decimals,
            mintAuthority: mintA.mintAuthority,
            metadataUri: mintA.metadataUri,
            imageUrl: mintA.imageUrl,
          },
        });

        // Create or get token B
        await tx.token.upsert({
          where: { id: mintB.mint },
          update: {
            name: mintB.name,
            symbol: mintB.symbol,
            decimals: mintB.decimals,
            mintAuthority: mintB.mintAuthority,
            metadataUri: mintB.metadataUri,
            imageUrl: mintB.imageUrl,
          },
          create: {
            id: mintB.mint,
            name: mintB.name,
            symbol: mintB.symbol,
            decimals: mintB.decimals,
            mintAuthority: mintB.mintAuthority,
            metadataUri: mintB.metadataUri,
            imageUrl: mintB.imageUrl,
          },
        });

        // Create pool
        await tx.liquidityPool.create({
          data: {
            id: poolId,
            mintAId: mintA.mint,
            mintBId: mintB.mint,
            lpMintAddress,
            lpMintDecimals,
            tradeFeeRate,
            configId,
          },
          include: {
            mintA: true,
            mintB: true,
          },
        });

        await tx.poolMetrics.create({
          data: {
            poolId,
            reserveA: reserveA.toFixed(9),
            reserveB: reserveB.toFixed(9),

            price: price.toFixed(12),

            liquidityUsd: liquidityUsd.toFixed(2),

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
        // await tx.poolMetrics.upsert({
        //   where: {
        //     poolId,
        //   },
        //   create: {
        //     poolId,
        //     reserveA: reserveA.toFixed(9),
        //     reserveB: reserveB.toFixed(9),

        //     price: price.toFixed(12),

        //     liquidityUsd: liquidityUsd.toFixed(2),

        //     lpSupply: lpSupply.toFixed(9),
        //     lpPrice: lpPrice.toFixed(9),

        //     holderCount,

        //     volume24h: volume24h.toFixed(2),
        //     volume7d: volume7d.toFixed(2),
        //     volume30d: volume30d.toFixed(2),

        //     fees24h: fees24h.toFixed(2),
        //     fees7d: fees7d.toFixed(2),
        //     fees30d: fees30d.toFixed(2),

        //     apr24h: apr24h.toFixed(4),
        //     apr7d: apr7d.toFixed(4),
        //   },
        //   update: {
        //     reserveA: reserveA.toFixed(9),
        //     reserveB: reserveB.toFixed(9),

        //     price: price.toFixed(12),

        //     liquidityUsd: liquidityUsd.toFixed(2),

        //     lpSupply: lpSupply.toFixed(9),
        //     lpPrice: lpPrice.toFixed(9),

        //     apr24h: apr24h.toFixed(4),
        //     apr7d: apr7d.toFixed(4),

        //     updatedAt: new Date(),
        //   },
        // });
      },
      {
        maxWait: 10000, // time to acquire a connection (default 2000ms)
        timeout: 20000, // time the transaction itself can run (default 5000ms)
      },
    );

    return NextResponse.json(
      {
        success: true,
        data: pool,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating liquidity pool:", error);

    // Prisma unique constraint
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "Liquidity pool already exists",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create liquidity pool",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pools = await prisma.liquidityPool.findMany({
      include: {
        mintA: true,
        mintB: true,
        metrics: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: pools,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error storing token:", error);
    if (error instanceof Error) {
      console.error("message:", error.message);
      console.error("cause:", (error as any).cause);
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get pool",
      },
      { status: 500 },
    );
  }
}
