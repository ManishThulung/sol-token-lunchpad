"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import SubmitButton from "@/components/ui/submit-button";
import { calculateLamports } from "@/lib/lamport";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  WalletNotConnectedError,
  WalletSendTransactionError,
} from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  address: z
    .string()
    .min(15, "Address must be at least 15 characters.")
    .max(100, "Address must be at most 100 characters."),
  amount: z.coerce
    .number({
      message: "Amount must be a number.",
    })
    .min(0.01, "Amount must be at least 0.01"),
});

const Transfer = ({
  title,
  type,
  mint,
  decimals,
}: {
  title: string;
  type: "SOL" | "TOKEN" | "MINT";
  mint?: PublicKey;
  decimals?: number;
}) => {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      amount: 0,
    },
  });

  const createOrGetATA = async (recipient: PublicKey, mint: PublicKey) => {
    try {
      if (!publicKey || !connected) throw new WalletNotConnectedError();
      // Derive ATA
      const ata = await getAssociatedTokenAddress(
        mint,
        recipient,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      // Check whether ATA already exists
      const accountInfo = await connection.getAccountInfo(ata);

      if (accountInfo) {
        console.log("ATA already exists:", ata.toBase58());
        return ata;
      }

      // Create ATA
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          publicKey, // payer
          ata, // recipient associated token account
          recipient, // recipient
          mint, // mint
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      );

      const signature = await sendTransaction(transaction, connection);

      const {
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      console.log("ATA created:", ata.toBase58());

      return ata;
    } catch (error) {
      console.log(error, "ata error");
      throw error;
    }
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      if (!publicKey) throw new WalletNotConnectedError();

      await connection.getMinimumBalanceForRentExemption(0);
      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      if (type === "SOL") {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(data.address),
            lamports: data.amount * LAMPORTS_PER_SOL,
          }),
        );

        const signature = await sendTransaction(transaction, connection, {
          minContextSlot,
        });

        await connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        });
        toast.success("Transaction successful.");
      } else if (type === "TOKEN") {
        if (!mint || !decimals) {
          toast.error("Mint address is required!");
          return;
        }
        const mintPublicKey = new PublicKey(mint);
        const recipientAta = await createOrGetATA(
          new PublicKey(data.address),
          mintPublicKey,
        );
        const payerAta = await createOrGetATA(publicKey, mintPublicKey);
        const lamports = calculateLamports(decimals);

        const transaction = new Transaction({
          feePayer: publicKey,
          blockhash,
          lastValidBlockHeight,
        }).add(
          // transfer token
          createTransferCheckedInstruction(
            payerAta,
            mint,
            recipientAta,
            publicKey,
            data.amount * lamports,
            decimals,
            [],
            TOKEN_2022_PROGRAM_ID,
          ),
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
        toast.success("Token transfered successfully.");
      } else {
        if (!mint || !decimals) {
          toast.error("Mint address is required!");
          return;
        }
        const mintPublicKey = new PublicKey(mint);

        const ata = await createOrGetATA(
          new PublicKey(data.address),
          mintPublicKey,
        );
        const lamports = calculateLamports(decimals);

        const transaction = new Transaction({
          feePayer: publicKey,
          blockhash,
          lastValidBlockHeight,
        }).add(
          // only mints the token
          createMintToCheckedInstruction(
            mint,
            ata,
            publicKey,
            data.amount * lamports,
            decimals,
            [],
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
        toast.success("Token supplied successfully.");
      }
    } catch (error: any) {
      console.error(error);
      console.dir(error, { depth: null });

      if (error instanceof WalletNotConnectedError) {
        console.log("cause", error.cause);
        toast.error("Wallent not connected");
        return;
      }

      if (
        error instanceof WalletSendTransactionError &&
        error.cause instanceof WalletNotConnectedError
      ) {
        toast.error("Wallet not connected");
        return;
      }

      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="text-white font-semibold text-lg py-2 px-4 bg-gray-700 hover:bg-black rounded flex gap-3 items-center cursor-pointer">
        <Send className="size-5" />
        {title}
      </DialogTrigger>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {type === "SOL" ? "Transfer SOL" : "Supply Token"}?
          </DialogTitle>
        </DialogHeader>

        <Separator className="mb-3" />

        <DialogDescription className="mb-4 text-gray-700">
          Are you sure, you want to transfer SOL?
        </DialogDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex gap-5 flex-col">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Amount"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.valueAsNumber))
                        }
                        value={Number(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex mt-5 w-full items-center justify-end gap-2 bg-transparent">
              <DialogClose>
                <Button
                  type="button"
                  variant={"outline"}
                  // onClick={handleClear}
                  className="w-fit rounded-[4px] px-6 py-3 text-sm font-semibold text-[#666666] md:text-base md:font-bold"
                >
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton
                type="submit"
                isSubmitting={form.formState.isSubmitting}
                className="w-fit rounded-[4px] text-sm font-semibold text-white md:text-base md:font-bold"
              >
                Save
              </SubmitButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Transfer;
