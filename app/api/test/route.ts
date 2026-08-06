import { Pool } from "pg";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const d = await prisma.poolMetrics.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json(
      {
        success: true,
        data: d,
      },
      { status: 201 },
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
        message: "Failed to store token",
      },
      { status: 500 },
    );
  }
}
