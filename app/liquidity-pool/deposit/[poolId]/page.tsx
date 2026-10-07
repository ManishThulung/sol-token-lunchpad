import CardWrapper from "@/components/card-wrapper";
import { DepositLiquidity } from "@/components/pool/deposit-liquidity-form";
import { SwapForm } from "@/components/pool/swap-form";
import { LiquidityPool } from "@/types";
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
    <div className="bg-[#F5F5F5] w-full h-full">
      {/* <div className="px-5 pb-5 md:pt-5 xl:max-w-[600px] xl2:max-w-[690px] 2xl:max-w-[800px] min-[2000px]:max-w-[1000px]"> */}
      <div className="lg:max-w-[600px]">
        <CardWrapper
          title="Deposit Liquidity"
          subTitle="Provide liquidity to the pool"
        >
          <DepositLiquidity
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
        </CardWrapper>
      </div>
    </div>
  );
}
