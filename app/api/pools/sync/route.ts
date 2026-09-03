import { syncPool } from "@/lib/server/db/sync-pool";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { poolId, txId } = await req.json();

  await syncPool(poolId, txId);

  return NextResponse.json({ success: true });
}
