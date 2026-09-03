import { SwapForm } from "@/components/swap/form";
import { LiquidityPool } from "@/types";
import { Settings } from "lucide-react";
import { headers } from "next/headers";

const getData = async (poolId: string) => {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/pools/${poolId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch pool");
  }

  return res.json();
};

export default async function page({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  const { data }: { data: LiquidityPool } = await getData(poolId.toString());

  return (
    <div className="h-full  flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 flex flex-col gap-5 shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold">Swap</h2>
            <p className="text-xs text-gray-400">Trade tokens instantly</p>
          </div>
          <button className="rounded-xl p-2 hover:bg-white/5">
            <Settings className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <SwapForm
          mintA={{
            symbol: data.mintA.symbol,
            amount: Number(data.metrics?.reserveA) || 0,
            address: data.mintA.id,
            decimals: data.mintA.decimals,
          }}
          mintB={{
            symbol: data.mintB.symbol,
            amount: Number(data.metrics?.reserveB) || 0,
            address: data.mintB.id,
            decimals: data.mintA.decimals,
          }}
          poolId={poolId}
        />
      </div>
    </div>
  );
}
