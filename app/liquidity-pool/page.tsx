"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFetch } from "@/hooks/use-fetch";
import { LiquidityPoolResponse } from "@/types";
import { ArrowRight, Droplets, Search } from "lucide-react";
import { useState } from "react";
import { CreateLiquidityModal } from "../../components/create-pool/page";

export default function LiquidityPoolsPage() {
  const [open, setOpen] = useState<boolean>(false);
  const { data, loading, error } =
    useFetch<LiquidityPoolResponse[]>("/api/pools");

  return (
    <div className="h-full bg-background">
      <div className="mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Liquidity Pools
            </h1>
            <p className="mt-1 text-muted-foreground">
              Browse all available pools and provide liquidity to earn trading
              fees.
            </p>
          </div>

          <CreateLiquidityModal open={open} onOpenChange={setOpen} />
          {/* <Button className="h-11 rounded-xl px-5">
            <Plus className="mr-2 h-4 w-4" />
            Create pool
          </Button> */}
        </div>

        {/* Search + filters */}
        <div className="mb-8 rounded-3xl border bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by token or pair"
                className="h-11 rounded-xl pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full px-3 py-1">All pools</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                SOL pairs
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                USDC pairs
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                New pools
              </Badge>
            </div>
          </div>
        </div>

        {loading ? (
          <>loading</>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data &&
                data?.map((pool) => (
                  <Card
                    key={pool.id}
                    className="rounded-3xl border-0 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardContent className="p-6">
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="h-11 w-11 rounded-full border-2 border-background bg-muted" />
                            <div className="h-11 w-11 rounded-full border-2 border-background bg-muted" />
                          </div>

                          <div>
                            <div className="text-lg font-semibold">
                              {pool.mintA.symbol} / {pool.mintB.symbol}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pool.mintB.name} · {pool.mintB.name}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-1"
                        >
                          Active
                        </Badge>
                      </div>

                      <div className="mb-5 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-muted/40 p-4">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Total liquidity
                          </div>
                          <div className="mt-2 text-xl font-bold">
                            {pool.metrics?.liquidityUsd}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-muted/40 p-4">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            24h volume
                          </div>
                          <div className="mt-2 text-xl font-bold">
                            {pool.metrics?.volume24h}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-muted/40 p-4">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            LP holders
                          </div>
                          <div className="mt-2 text-xl font-bold">
                            {pool.metrics?.holderCount}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-muted/40 p-4">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            APR
                          </div>
                          <div className="mt-2 text-xl font-bold text-green-600">
                            {pool.metrics?.apr24h}
                          </div>
                        </div>
                      </div>

                      <Separator className="my-5" />

                      <div className="mb-5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Droplets className="h-4 w-4" />
                          Created {pool.createdAt}
                        </div>

                        <div className="font-medium">Fee 0.25%</div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="h-11 flex-1 rounded-xl px-4"
                        >
                          Add liquidity
                        </Button>

                        <Button className="h-11 flex-1 rounded-xl px-4">
                          Swap
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {data?.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed py-20 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Droplets className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">
                  No liquidity pools found
                </h3>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Create the first liquidity pool on your platform and start
                  earning trading fees.
                </p>
                <CreateLiquidityModal open={open} onOpenChange={setOpen} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
// const handleInit = async () => {
//   if (!publicKey) return;
//   const raydium = await createRaydium({
//     connection,
//     owner: publicKey,
//     signAllTransactions,
//   });
//   const { poolInfo: pool } = await raydium.cpmm.getPoolInfoFromRpc(
//     "BWCk1QFGJJFGP5reLiWeLauAwPWmEhXx6uCuaXhj7K7j",
//   );

//   const priceAUsd = Decimal(180);
//   const priceBUsd = getTokenUsdPriceFromDevnetPool(
//     pool.mintAmountA,
//     pool.mintAmountB,
//     pool.mintB.decimals,
//   );
//   const payload: {
//     mintA: Omit<TokenMetadataResponse, "supply" | "price">;
//     mintB: Omit<TokenMetadataResponse, "supply" | "price">;
//     poolId: string;
//     lpMintAddress: string;
//     lpMintDecimals: number;
//     tradeFeeRate: number;
//     configId: string;
//     poolMintAmountA: number;
//     poolMintAmountB: number;
//     lpAmount: number;
//     priceAUsd: string;
//     priceBUsd: string;
//   } = {
//     mintA: {
//       mint: "So11111111111111111111111111111111111111112",
//       symbol: "SOL",
//       name: "Solana",
//       balance: 12.84,
//       decimals: 9,
//       mintAuthority: null,
//       metadataUri: "https",
//       imageUrl: "null",
//     },
//     mintB: {
//       mint: "8zRsA8Kdr5ynt7Pj3HRP6X5AAe5AeU193AiMZdTDKE2r",
//       name: "Football World Cup",
//       symbol: "WCUP",
//       decimals: 6,
//       mintAuthority: null,
//       metadataUri:
//         "https://sol-token-lunchpad-rho.vercel.app/api/tokens/8zRsA8Kdr5ynt7Pj3HRP6X5AAe5AeU193AiMZdTDKE2r/metadata",
//       imageUrl: null,
//       balance: 0,
//     },
//     poolId: "BWCk1QFGJJFGP5reLiWeLauAwPWmEhXx6uCuaXhj7K7j",
//     lpMintAddress: pool.lpMint.address,
//     lpMintDecimals: pool.lpMint.decimals,
//     tradeFeeRate: pool.config.tradeFeeRate,
//     configId: pool.config.id,
//     poolMintAmountA: pool.mintAmountA,
//     poolMintAmountB: pool.mintAmountB,
//     lpAmount: pool.lpAmount,
//     priceAUsd: priceAUsd.toString(),
//     priceBUsd: priceBUsd.toString(),
//   };
//   await fetch("/api/pools", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });
// };
// useEffect(() => {
//   handleInit();
// }, [publicKey]);
