import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";

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
      success: true,
      data: token,
    });
  } catch (error) {
    console.error("Error fetching token:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch token",
      },
      { status: 500 },
    );
  }
}
