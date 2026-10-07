"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createRaydium } from "@/lib/raydium";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CurveCalculator,
  FeeOn,
  Percent,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import Decimal from "decimal.js";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface IProps {
  symbol: string;
  amount: number;
  address: string;
  decimals: number;
}

const swapSchema = z
  .object({
    mintAAmount: z.string(),
    mintAAddress: z.string(),
    mintBAmount: z.string(),
    mintBAddress: z.string(),
    slipage: z.number().max(50).min(0),
  })
  .refine((data) => data.mintAAddress !== data.mintBAddress, {
    path: ["mintBAddress"],
    message: "From and To tokens cannot be the same",
  });

type DepositLiquidityValues = z.infer<typeof swapSchema>;

export function DepositLiquidity({
  poolId,
  mintA,
  mintB,
}: {
  poolId: string;
  mintA: IProps;
  mintB: IProps;
}) {
  const { connection } = useConnection();
  const { publicKey, signAllTransactions } = useWallet();

  const form = useForm<DepositLiquidityValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      mintAAmount: undefined,
      mintAAddress: mintA.address,
      mintBAmount: undefined,
      mintBAddress: mintB.address,
      slipage: 0.5,
    },
  });

  const mintAAddress = form.watch("mintAAddress");
  const mintBAddress = form.watch("mintBAddress");
  const fromToken = mintA.address == mintAAddress ? mintA : mintB;
  const toToken = mintA.address == mintBAddress ? mintA : mintB;

  // depositedId=5ssN2PmJHxBMwNXMzLMcpw2R6KhCkNvXT6d9CnixKM9zHt1q5yW1ypSrLa5kngegSyip27KdQsLeUb7xgp8XbVUh

  const onSubmit = async (values: DepositLiquidityValues) => {
    try {
      if (!publicKey) {
        toast.error("Connect the wallet");
        return;
      }
      const raydium = await createRaydium({
        connection,
        owner: publicKey,
        signAllTransactions,
      });

      const { poolInfo, poolKeys } =
        await raydium.cpmm.getPoolInfoFromRpc(poolId);

      // const baseIn = poolInfo.mintA.address === values.mintAAddress;

      const inputAmount = new BN(
        new Decimal(values.mintAAmount)
          .mul(new Decimal(10).pow(poolInfo.mintA.decimals))
          .toFixed(0),
      );

      console.log({
        mintAAmount: values.mintAAmount,
        decimals: poolInfo.mintA.decimals,
        rawInput: inputAmount.toString(),
      });

      const { execute, extInfo } = await raydium.cpmm.addLiquidity({
        poolInfo,
        poolKeys,
        inputAmount,
        slippage: new Percent(Math.round(Number(values.slipage) * 100), 10000),
        baseIn: true,
        txVersion: TxVersion.V0,
      });

      const { txId } = await execute({ sendAndConfirm: true });

      console.log("Liquidity added!");
      console.log("TX:", txId);

      console.log("Explorer:");
      console.log(`https://solscan.io/tx/${txId}`);

      console.log("Details:", extInfo);
      toast.success("Liquidity Depositd successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to deposit liquidity.");
    }
  };

  const mintARatePerToken = mintB.amount / mintA.amount;
  const mintBRatePerToken = mintA.amount / mintB.amount;

  const handleChange = (name: string, value: string) => {
    if (name == "mintAAmount") {
      const rate =
        mintA.address == mintAAddress ? mintARatePerToken : mintBRatePerToken;
      form.setValue("mintBAmount", (rate * Number(value)).toString());
      form.setValue("mintAAmount", value);
    }
    if (name == "mintBAmount") {
      const rate =
        mintA.address == mintBAddress ? mintARatePerToken : mintBRatePerToken;
      form.setValue("mintAAmount", (rate * Number(value)).toString());
      form.setValue("mintBAmount", value);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-4 flex-col justify-between"
      >
        <div className="flex rounded-lg border border-gray-300">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="mintAAmount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="0.0"
                      {...field}
                      value={field.value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="border h-12 rounded-r-none border-gray-300 px-3 bg-transparent text-base font-semibold shadow-none placeholder:text-gray-600 focus-visible:ring-0"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="w-[60px] border-l border-gray-300 flex items-center justify-center text-base font-semibold text-gray-600 ">
            {fromToken?.symbol}
          </div>
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-2xl mx-auto mt-6 border border-white/10 bg-[#111827] hover:bg-[#1a2438]"
        >
          <Plus className="h-5 w-5 text-[#14F195]" />
        </Button>

        <div className="flex rounded-lg border border-gray-300 mt-4">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="mintBAmount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="0.0"
                      {...field}
                      value={field.value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="border h-12 rounded-r-none border-gray-300 px-3 bg-transparent text-base font-semibold shadow-none placeholder:text-gray-600 focus-visible:ring-0"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="w-[60px] border-l border-gray-300 flex items-center justify-center text-base font-semibold text-gray-600 ">
            {toToken?.symbol}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Total Deposit</span>
            <span className="text-black">
              1 {mintA.symbol} = {mintARatePerToken} {mintB.symbol}
            </span>
          </div>

          <div className="mt-3 flex justify-between text-gray-400">
            <span>Deposit Ration</span>
            <span className="text-green-400">0.02%</span>
          </div>

          <div className="mt-3 flex justify-between text-gray-400">
            <span>Liquidity Slippage</span>
            <div className="flex items-center gap-1">
              <FormField
                control={form.control}
                name="slipage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="0.0"
                        {...field}
                        className="border border-gray-300 rounded-sm px-1 w-[40px]  bg-transparent text-sm font-semibold shadow-none placeholder:text-black focus-visible:ring-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-black">%</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-2 w-full rounded-sm py-6 text-lg font-semibold"
        >
          Deposit Liquidity
        </Button>
      </form>
    </Form>
  );
}
