"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFetch } from "@/hooks/use-fetch";
import { useDebounced } from "@/hooks/useDebounced";
import { createRaydium } from "@/lib/raydium";
import { getTokenUsdPriceFromDevnetPool } from "@/lib/sol/fetch-price";
import { Token } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DEVNET_PROGRAM_ID, TxVersion } from "@raydium-io/raydium-sdk-v2";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import Decimal from "decimal.js";
import { ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const programId = DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM;
const poolFeeAccount = DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC;

const schema = z
  .object({
    baseToken: z.string().min(1, "Select a token"),
    quoteToken: z.string().min(1, "Select a token"),
    baseAmount: z.string().min(1, "Enter amount"),
    quoteAmount: z.string().min(1, "Enter amount"),
  })
  .refine((v) => v.baseToken !== v.quoteToken, {
    path: ["quoteToken"],
    message: "Tokens must be different",
  });

type FormValues = z.infer<typeof schema>;

// const TOKENS: TokenMetadataResponse[] = [
//   {
//     mint: "So11111111111111111111111111111111111111112",
//     symbol: "SOL",
//     name: "Solana",
//     // balance: 12.84,
//     // price: 180.24,
//     // supply: "1",
//     decimals: 9,
//     mintAuthority: null,
//     metadataUri: "https",
//     imageUrl: "/file.svg",
//   },
//   {
//     mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//     symbol: "USDC",
//     name: "USD Coin",
//     // balance: 4820,
//     // price: 1,
//     // supply: "1",
//     decimals: 9,
//     mintAuthority: null,
//     metadataUri: "https",
//     imageUrl: "/file.svg",
//   },
//   {
//     mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
//     symbol: "BONK",
//     name: "Bonk",
//     // balance: 12000000,
//     // price: 0.000021,
//     // supply: "1",
//     decimals: 9,
//     mintAuthority: null,
//     metadataUri: "https",
//     imageUrl: "/file.svg",
//   },
// ];

function TokenSelect({
  value,
  onChange,
  placeholder,
  allTokens,
  onTokenDiscovered,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  allTokens: Token[];
  onTokenDiscovered: (token: Token) => void;
}) {
  const { connection } = useConnection();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredTokens, setFilteredTokens] = useState(allTokens);

  const debouncedSearch = useDebounced(
    search.trim() === "" ? null : search.trim(),
    400,
  );

  const selected = allTokens.find((t) => t.id === value);

  useEffect(() => {
    setFilteredTokens(allTokens);
  }, [allTokens]);

  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearch = async (query: string | null) => {
    if (!query) {
      setFilteredTokens(allTokens);
      return;
    }

    const q = query.toLowerCase();

    const localMatches = allTokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );

    if (localMatches.length > 0) {
      setFilteredTokens(localMatches);
      return;
    }

    try {
      const accountInfo = await connection.getParsedAccountInfo(
        new PublicKey(query),
      );

      if (!accountInfo.value || !("parsed" in accountInfo.value.data)) {
        setFilteredTokens([]);
        return;
      }

      const info = accountInfo.value.data.parsed.info;

      const metadataExtension = info.extensions?.find(
        (ext: any) => ext.extension === "tokenMetadata",
      );

      if (!metadataExtension) {
        setFilteredTokens([]);
        return;
      }

      const metadataUri = metadataExtension.state.uri;

      let imageUrl: string | null = null;

      if (metadataUri) {
        try {
          const response = await fetch(metadataUri);
          if (response.ok) {
            const metadata = await response.json();
            imageUrl = metadata.image || null;
          }
        } catch {}
      }

      const newToken: Token = {
        id: metadataExtension.state.mint,
        name: metadataExtension.state.name,
        symbol: metadataExtension.state.symbol,
        decimals: info.decimals,
        mintAuthority: info.mintAuthority,
        metadataUri,
        imageUrl,
        description: "jjj", // verify it later
        revokeAuthority: null, // verify it later
      };

      onTokenDiscovered(newToken);
      setFilteredTokens([newToken]);
    } catch (error) {
      console.error(error);
      setFilteredTokens([]);
    }
  };

  const handleSelect = (mint: string) => {
    onChange(mint);
    setSearch("");
    setFilteredTokens(allTokens);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-14 w-full justify-between rounded-xl px-4"
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            {selected.imageUrl ? (
              <img
                src={selected.imageUrl}
                alt={selected.symbol}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted" />
            )}

            <div className="text-left">
              <div className="font-semibold">{selected.symbol}</div>
              <div className="text-xs text-muted-foreground">
                {selected.name}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}

        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setSearch("");
            setFilteredTokens(allTokens);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl p-0">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle className="text-xl">Select token</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by token or paste mint address"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <Separator />

          <div className="max-h-[420px] overflow-y-auto px-2 py-2">
            {filteredTokens.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No token found
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => handleSelect(token.id)}
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {token.imageUrl ? (
                      <img
                        src={token.imageUrl}
                        alt={token.symbol}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}

                    <div className="text-left">
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {token.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {token.id.slice(0, 4)}...
                        {token.id.slice(-4)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {/* {token.balance.toLocaleString()} */}
                      77
                    </div>
                    <div className="text-xs text-muted-foreground">Balance</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AmountInput({
  token,
  value,
  onChange,
}: {
  token?: Token;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <span className="font-semibold">
            {token?.symbol ?? "Select token"}
          </span>
        </div>

        <span className="text-sm text-muted-foreground">
          {/* Balance: {token?.balance ?? 0} */}
          Balance: 4
        </span>
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

function PoolSummary({
  baseToken,
  quoteToken,
  baseAmount,
  quoteAmount,
}: {
  baseToken?: Token;
  quoteToken?: Token;
  baseAmount: string;
  quoteAmount: string;
}) {
  const price =
    baseToken && quoteToken && Number(baseAmount) > 0
      ? Number(quoteAmount) / Number(baseAmount)
      : 0;

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <h3 className="mb-3 font-semibold">Pool summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pool share</span>
          <span>100%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Initial price</span>
          <span>
            {baseToken?.symbol && quoteToken?.symbol
              ? `1 ${baseToken.symbol} = ${price.toFixed(6)} ${quoteToken.symbol}`
              : "-"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">LP tokens</span>
          <span>Estimated</span>
        </div>
      </div>
    </div>
  );
}

export function CreateLiquidityModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, signAllTransactions } = useWallet();
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data, loading, error } = useFetch<Token[]>("/api/tokens");
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      baseToken: "",
      quoteToken: "",
      baseAmount: "",
      quoteAmount: "",
    },
  });

  const addToken = (token: Token) => {
    setAllTokens((prev) => {
      const exists = prev.some((t) => t.id === token.id);
      return exists ? prev : [...prev, token];
    });
  };

  const values = form.watch();

  const baseToken = allTokens.find((t) => t.id === values.baseToken);
  const quoteToken = allTokens.find((t) => t.id === values.quoteToken);

  const next = async () => {
    const valid = await form.trigger(["baseToken", "quoteToken"]);
    if (valid) setStep(2);
  };

  const back = () => setStep(1);

  const onSubmit = async (data: FormValues) => {
    if (!baseToken || !quoteToken) {
      toast.error("Base Token and Quote Token must be selected.");
      return;
    }
    console.log("Create pool", data);
    try {
      if (!publicKey) throw new WalletNotConnectedError();
      setIsSubmitting(true);
      const raydium = await createRaydium({
        connection,
        owner: publicKey,
        signAllTransactions,
      });
      // Convert human-readable amounts into on-chain base units
      // -----------------------------------------
      const baseAmount = new BN(
        new Decimal(values.baseAmount)
          .mul(new Decimal(10).pow(Number(baseToken?.decimals)))
          .toFixed(0),
      );
      const quoteAmount = new BN(
        new Decimal(values.quoteAmount)
          .mul(new Decimal(10).pow(Number(quoteToken?.decimals))) //tokenDecimals
          .toFixed(0),
      );

      // ── Pick the 0.25% fee tier ─────────────────────────────────────
      const feeConfigs = await raydium.api.getCpmmConfigs();
      const feeConfig = feeConfigs.find((c) => c.index === 0);
      if (!feeConfig)
        throw new Error("0.25% fee tier not found in CPMM configs.");

      // ── Resolve mint metadata (Token-2022-aware) ────────────────────
      const baseTokenMint = await raydium.token.getTokenInfo(
        new PublicKey(values.baseToken),
      );
      const quoteTokenMint = await raydium.token.getTokenInfo(
        new PublicKey(values.quoteToken),
      );

      // ── Build and execute ───────────────────────────────────────────
      try {
        const { execute, extInfo } = await raydium.cpmm.createPool({
          programId,
          poolFeeAccount,
          mintA: baseTokenMint,
          mintB: quoteTokenMint,
          mintAAmount: baseAmount,
          mintBAmount: quoteAmount,
          startTime: new BN(0), // open immediately
          feeConfig,
          associatedOnly: false,
          ownerInfo: { useSOLBalance: true },
          txVersion: TxVersion.V0,
          computeBudgetConfig: {
            units: 600_000,
            microLamports: 100_000,
          },
        });

        const { txId } = await execute({ sendAndConfirm: true });

        // const { price, supply, ...mintAPayload } = baseToken;
        // const { price: prices, supply: sup, ...mintBPayload } = quoteToken;

        const { poolInfo: pool } = await raydium.cpmm.getPoolInfoFromRpc(
          extInfo.address.poolId.toBase58(),
        );

        // const priceAUsd = await getTokenUsdPrice(baseToken.mint);
        const priceAUsd = Decimal(180);
        const priceBUsd = getTokenUsdPriceFromDevnetPool(
          pool.mintAmountA,
          pool.mintAmountB,
          pool.mintB.decimals,
        );
        const payload: {
          mintA: Omit<Token, "supply" | "price">;
          mintB: Omit<Token, "supply" | "price">;
          poolId: string;
          lpMintAddress: string;
          lpMintDecimals: number;
          tradeFeeRate: number;
          configId: string;
          poolMintAmountA: number;
          poolMintAmountB: number;
          lpAmount: number;
          priceAUsd: Decimal;
          priceBUsd: Decimal;
        } = {
          mintA: baseToken,
          mintB: quoteToken,
          poolId: extInfo.address.poolId.toBase58(),
          lpMintAddress: pool.lpMint.address,
          lpMintDecimals: pool.lpMint.decimals,
          tradeFeeRate: pool.config.tradeFeeRate,
          configId: pool.config.id,
          poolMintAmountA: pool.mintAmountA,
          poolMintAmountB: pool.mintAmountB,
          lpAmount: pool.lpAmount,
          priceAUsd,
          priceBUsd,
        };
        await fetch("/api/tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        console.log({
          poolId: extInfo.address.poolId.toBase58(),
          txId,
        });
        //         {
        //     "tokenAmount": "30000",
        //     "solAmount": "3",
        //     "poolId": "BWCk1QFGJJFGP5reLiWeLauAwPWmEhXx6uCuaXhj7K7j",
        //     "txId": "4qw9NUV2uzLyKcV4TjYAqPwe4Mi1tZv9U6bXA8BUx91ZAkor5fRAPpguWCaYJnYnwFavEkhLTjjwQtxJ26vVdXCP"
        // }
        toast.success("Liquidity pool created succesfully.");
      } catch (error) {
        throw error;
      }

      // Create Raydium pool here
    } catch (error) {
      console.error("Failed to create liquidity pool:", error);
      if (error instanceof Error) {
        console.error(error.stack);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!data) return;
    setAllTokens(data);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="h-11 cursor-pointer px-5 flex gap-2 items-center bg-black text-white border rounded-sm">
        <Plus className="mr-2 h-4 w-4" />
        Create pool
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Create liquidity pool
            </DialogTitle>

            <Badge variant="secondary">Step {step} of 2</Badge>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-semibold">Select token pair</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the two tokens you want to provide liquidity for.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="baseToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base token</FormLabel>
                      <FormControl>
                        <TokenSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select base token"
                          allTokens={allTokens}
                          onTokenDiscovered={addToken}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quoteToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote token</FormLabel>
                      <FormControl>
                        <TokenSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select quote token"
                          allTokens={allTokens}
                          onTokenDiscovered={addToken}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex justify-end">
                  <Button type="button" onClick={next}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-semibold">Deposit liquidity</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter the amount of each token to deposit into the pool.
                  </p>
                </div>

                <Controller
                  control={form.control}
                  name="baseAmount"
                  render={({ field }) => (
                    <AmountInput
                      token={baseToken}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="quoteAmount"
                  render={({ field }) => (
                    <AmountInput
                      token={quoteToken}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <PoolSummary
                  baseToken={baseToken}
                  quoteToken={quoteToken}
                  baseAmount={values.baseAmount}
                  quoteAmount={values.quoteAmount}
                />

                <Separator />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={back}>
                    Back
                  </Button>

                  <Button type="submit">Create pool</Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
