import { prisma } from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      mintAddress,
      mintAuthority,
      decimals,
      name,
      symbol,
      description,
      imageUrl,
      revokeFreeze,
    } = body;

    if (!mintAddress || !name || !symbol || decimals === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing",
        },
        { status: 400 },
      );
    }

    const token = await prisma.solanaToken.upsert({
      where: {
        mintAddress,
      },
      update: {
        userId: "sdfs",
        mintAddress,
        mintAuthority,
        decimals,
        name,
        symbol,
        description,
        imageUrl,
        revokeFreeze,
      },
      create: {
        userId: "sdfs",
        mintAddress,
        mintAuthority,
        decimals,
        name,
        symbol,
        description,
        imageUrl,
        revokeFreeze,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error storing token:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to store token",
      },
      { status: 500 },
    );
  }
}
