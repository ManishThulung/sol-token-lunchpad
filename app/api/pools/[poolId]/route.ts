import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    poolId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { poolId } = await context.params;

    const pool = await prisma.liquidityPool.findUnique({
      where: {
        id: poolId,
      },
      include: {
        mintA: true,
        mintB: true,
        metrics: true,
      },
    });

    if (!pool) {
      return NextResponse.json(
        {
          success: false,
          message: "pool not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: pool,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch pool",
      },
      { status: 500 },
    );
  }
}
