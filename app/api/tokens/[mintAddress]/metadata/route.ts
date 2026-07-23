import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    mintAddress: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { mintAddress } = await context.params;

    const token = await prisma.solanaToken.findUnique({
      where: {
        mintAddress,
      },
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Token not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      image: token.imageUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch token",
      },
      { status: 500 },
    );
  }
}
