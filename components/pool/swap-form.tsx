"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createRaydium } from "@/lib/raydium";
import { zodResolver } from "@hookform/resolvers/zod";
import { CurveCalculator, FeeOn, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import { ArrowDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CustomeSelect } from "../custom-select";
import { useEffect } from "react";
import Decimal from "decimal.js";

interface IProps {
  symbol: string;
  amount: number;
  address: string;
  decimals: number;
}

const swapSchema = z
  .object({
    fromAmount: z.string(),
    fromAddress: z.string(),
    toAmount: z.string(),
    toAddress: z.string(),
    slipage: z.number().max(50).min(0),
  })
  .refine((data) => data.fromAddress !== data.toAddress, {
    path: ["toAddress"],
    message: "From and To tokens cannot be the same",
  });

type SwapFormValues = z.infer<typeof swapSchema>;

export function SwapForm({
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

  const options = [
    {
      label: mintA.symbol,
      value: mintA.address,
    },
    {
      label: mintB.symbol,
      value: mintB.address,
    },
  ];

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      fromAmount: undefined,
      fromAddress: mintA.address,
      toAmount: undefined,
      toAddress: mintB.address,
      slipage: 0.5,
    },
  });

  const fromAddress = form.watch("fromAddress");
  const toAddress = form.watch("toAddress");
  const fromToken = mintA.address == fromAddress ? mintA : mintB;
  const toToken = mintA.address == toAddress ? mintA : mintB;

  const onSubmit = async (values: SwapFormValues) => {
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

      const { poolInfo, poolKeys, rpcData } =
        await raydium.cpmm.getPoolInfoFromRpc(poolId);

      const baseIn = poolInfo.mintA.address === values.fromAddress;

      const inputAmount = new BN(
        new Decimal(values.fromAmount)
          .mul(new Decimal(10).pow(fromToken.decimals))
          .toFixed(0),
      );

      console.log({
        fromAmount: values.fromAmount,
        decimals: fromToken.decimals,
        rawInput: inputAmount.toString(),
        baseIn,
      });

      const swapResult = CurveCalculator.swapBaseInput(
        inputAmount,
        baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
        baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
        rpcData.configInfo!.tradeFeeRate,
        rpcData.configInfo!.creatorFeeRate,
        rpcData.configInfo!.protocolFeeRate,
        rpcData.configInfo!.fundFeeRate,
        rpcData.feeOn === FeeOn.BothToken || rpcData.feeOn === FeeOn.OnlyTokenB,
      );

      console.log(
        "swap result",
        Object.keys(swapResult).reduce(
          (acc, cur) => ({
            ...acc,
            [cur]: swapResult[cur as keyof typeof swapResult].toString(),
          }),
          {},
        ),
      );

      const { execute } = await raydium.cpmm.swap({
        poolInfo,
        poolKeys,
        inputAmount,
        swapResult,
        slippage: values.slipage / 100,
        baseIn,
        txVersion: TxVersion.V0,
        computeBudgetConfig: {
          units: 250_000,
          microLamports: 50_000,
        },
      });

      const { txId } = await execute({ sendAndConfirm: true });
      console.log(txId, "transaction id");
      const tx = await connection.getParsedTransaction(txId, {
        maxSupportedTransactionVersion: 0,
      });

      console.log(tx?.meta?.preTokenBalances);
      console.log(tx?.meta?.postTokenBalances);
      console.log(tx?.meta?.logMessages);
      toast.success("Swap successful.");
    } catch (error) {
      console.error(error);
      toast.error("Swap failed.");
    }
  };

  const mintARatePerToken = mintB.amount / mintA.amount;
  const mintBRatePerToken = mintA.amount / mintB.amount;

  const handleChange = (name: string, value: string) => {
    if (name == "fromAmount") {
      const rate =
        mintA.address == fromAddress ? mintARatePerToken : mintBRatePerToken;
      form.setValue("toAmount", (rate * Number(value)).toString());
      form.setValue("fromAmount", value);
    }
    if (name == "toAmount") {
      const rate =
        mintA.address == toAddress ? mintARatePerToken : mintBRatePerToken;
      form.setValue("fromAmount", (rate * Number(value)).toString());
      form.setValue("toAmount", value);
    }
  };

  useEffect(() => {
    if (fromAddress) {
      form.setValue("toAddress", toToken.address);
    }
    if (toAddress) {
      form.setValue("fromAddress", fromToken.address);
    }
  }, [fromAddress, toAddress]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-4 flex-col justify-between"
      >
        <div className="rounded-2xl border border-white/10">
          <div className="mb-3 flex items-center justify-between text-sm text-gray-400">
            <span>From</span>
            <span>{fromToken?.symbol}</span>
          </div>

          <div className="flex rounded-lg border border-gray-300">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="fromAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="0.0"
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        className="border h-12 rounded-r-none border-gray-300 px-3 bg-transparent text-base font-semibold shadow-none placeholder:text-gray-600 focus-visible:ring-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="w-[100px] border-l border-gray-300">
              <FormField
                control={form.control}
                name={"fromAddress"}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CustomeSelect
                        label=""
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          form.setValue(
                            "toAddress",
                            value === mintA.address
                              ? mintB.address
                              : mintA.address,
                            { shouldValidate: true },
                          );
                        }}
                        options={options}
                        className="rounded-none border-0 shadow-none"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          {/* <div className="flex items-center justify-between gap-4">
            <FormField
              control={form.control}
              name="fromAmount"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="0.0"
                      {...field}
                      value={field.value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="border border-gray-300 px-2 bg-transparent text-base font-semibold shadow-none placeholder:text-gray-600 focus-visible:ring-0"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="secondary"
              className="rounded-xl px-0 bg-white/10 hover:bg-white/15"
            >
              <div className="h-6 w-6 rounded-full bg-[#14F195]" />
              <span className="font-medium">{mintA.symbol}</span>
            </Button>
          </div> */}
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-2xl mx-auto mt-6 border border-white/10 bg-[#111827] hover:bg-[#1a2438]"
        >
          <ArrowDown className="h-5 w-5 text-[#14F195]" />
        </Button>

        <div className="rounded-2xl border border-white/10">
          <div className="mb-3 flex items-center justify-between text-sm text-gray-400">
            <span>To</span>
            <span>{toToken.symbol}</span>
          </div>

          <div className="flex rounded-lg border border-gray-300">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="toAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="0.0"
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        className="border h-12 rounded-r-none border-gray-300 px-3 bg-transparent text-base font-semibold shadow-none placeholder:text-gray-600 focus-visible:ring-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="w-[100px] border-l border-gray-300">
              <FormField
                control={form.control}
                name={"toAddress"}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CustomeSelect
                        label=""
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          form.setValue(
                            "fromAddress",
                            value === mintA.address
                              ? mintB.address
                              : mintA.address,
                            { shouldValidate: true },
                          );
                        }}
                        options={options}
                        className="rounded-none border-0 shadow-none"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Rate</span>
            <span className="text-black">
              1 {mintA.symbol} = {mintARatePerToken} {mintB.symbol}
            </span>
          </div>

          <div className="mt-3 flex justify-between text-gray-400">
            <span>Price impact</span>
            <span className="text-green-400">0.02%</span>
          </div>

          <div className="mt-3 flex justify-between text-gray-400">
            <span>Network fee</span>
            <span className="text-black">0.000005 SOL</span>
          </div>

          <div className="mt-3 flex justify-between text-gray-400">
            <span>Slippage</span>
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
          Send
        </Button>
      </form>
    </Form>
  );
}
