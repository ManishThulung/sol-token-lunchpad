"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { calculateLamports } from "@/lib/lamport";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AuthorityType,
  createAssociatedTokenAccountInstruction,
  createInitializeInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  createSetAuthorityInstruction,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import {
  createUpdateAuthorityInstruction,
  pack,
} from "@solana/spl-token-metadata";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters.")
    .max(100, "Name must be at most 100 characters."),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters.")
    .max(100, "Symbol must be at most 100 characters."),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(100, "Description must be at most 100 characters."),
  imageUrl: z.url(),
  decimals: z.coerce
    .number({
      message: "Decimals must be a number.",
    })
    .int("Decimals must be a whole number.")
    .min(0)
    .max(18),
  supply: z.coerce
    .number({
      message: "Supply must be a number.",
    })
    .int("Supplu must be a whole number.")
    .min(1),
  revokeFreeze: z.boolean(),
  revokeMint: z.boolean(),
  revokeMetadataUpdate: z.boolean(),
});
type FormValues = {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  decimals: number;
  revokeFreeze: boolean;
  supply: number;
  revokeMint: boolean;
  revokeMetadataUpdate: boolean;
};

const TokenMint = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      imageUrl: "",
      decimals: 6,
      revokeFreeze: false,
      supply: 1,
      revokeMint: false,
      revokeMetadataUpdate: false,
    },
  });

  const uploadToCloudinary = async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );
      formData.append("folder", "token-lunchpad");
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      form.setValue("imageUrl", data.secure_url, {
        shouldValidate: true,
      });

      setPreview(data.secure_url);
    } catch (error) {
      console.error(error);

      form.setError("imageUrl", {
        type: "manual",
        message: "Failed to upload image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) return;

    await uploadToCloudinary(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 5 * 1024 * 1024,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (!publicKey) throw new WalletNotConnectedError();
      const mintKeypair = Keypair.generate();

      const name = values.name;
      const symbol = values.symbol;
      const uri = `https://sol-token-lunchpad-rho.vercel.app/api/tokens/${mintKeypair.publicKey.toBase58()}/metadata`;

      const payload = {
        mintAddress: mintKeypair.publicKey.toBase58(),
        mintAuthority: publicKey.toBase58(),
        decimals: values.decimals,
        name,
        symbol,
        description: values.description,
        imageUrl: values.imageUrl,
        revokeFreeze: values.revokeFreeze,
      };
      await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Calculate metadata size
      const metadata = {
        updateAuthority: publicKey,
        mint: mintKeypair.publicKey,
        name,
        symbol,
        uri,
        additionalMetadata: [],
      };

      const mintSpace = getMintLen([ExtensionType.MetadataPointer]);
      const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
      const totalSpace = mintSpace + metadataSpace;
      const mintRent =
        await connection.getMinimumBalanceForRentExemption(totalSpace);
      const lamports = calculateLamports(values.decimals);

      const {
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      // derive ata
      const ata = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: publicKey,
      }).add(
        // create mint account
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          lamports: mintRent,
          space: mintSpace,
          programId: TOKEN_2022_PROGRAM_ID,
        }),

        // Initialize Metadata Pointer
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
        ),

        // initialize mint
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          values.decimals,
          publicKey,
          values.revokeFreeze ? null : publicKey,
          TOKEN_2022_PROGRAM_ID,
        ),

        // Initialize Token Metadata
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintKeypair.publicKey,
          updateAuthority: publicKey,
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey,
          name,
          symbol,
          uri,
        }),

        // create ata
        createAssociatedTokenAccountInstruction(
          publicKey,
          ata,
          publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),

        // token mint
        createMintToCheckedInstruction(
          mintKeypair.publicKey,
          ata,
          publicKey,
          values.supply * lamports,
          values.decimals,
          [],
          TOKEN_2022_PROGRAM_ID,
        ),

        // Revoke mint authority
        ...(values.revokeMint
          ? [
              createSetAuthorityInstruction(
                mintKeypair.publicKey,
                publicKey,
                AuthorityType.MintTokens,
                null,
                [],
                TOKEN_2022_PROGRAM_ID,
              ),
            ]
          : []),

        // Revoke metadata update authority
        ...(values.revokeMetadataUpdate
          ? [
              createUpdateAuthorityInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                metadata: mintKeypair.publicKey,
                oldAuthority: publicKey,
                newAuthority: null,
              }),
            ]
          : []),
      );
      transaction.partialSign(mintKeypair);

      const simulation = await connection.simulateTransaction(transaction);
      console.log(simulation.value);
      console.log(simulation.value.logs);

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      console.log("Mint:", mintKeypair.publicKey.toBase58());
      toast.success("Token created successfully.");
      form.reset();
    } catch (error) {
      console.log(error, "token mint");
      console.dir(error, { depth: null });
      if (error instanceof WalletNotConnectedError) {
        toast.error("wallet not connected!");
        return;
      }
    }
  };
  return (
    <Card className="mx-auto w-full max-w-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Create your token</CardTitle>

        <CardDescription>
          Create a new Solana token by providing some basic information.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Token Image */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Token image</FormLabel>

                  <FormControl>
                    <div
                      {...getRootProps()}
                      className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <input {...getInputProps()} />

                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />

                          <p className="text-sm text-muted-foreground">
                            Uploading image...
                          </p>
                        </div>
                      ) : preview ? (
                        <div className="relative">
                          <img
                            src={preview}
                            alt="Token preview"
                            className="h-40 w-40 rounded-2xl object-cover shadow-md"
                          />

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              setPreview(null);

                              form.setValue("imageUrl", "", {
                                shouldValidate: true,
                              });
                            }}
                            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            {isDragActive ? (
                              <Upload className="h-6 w-6 text-primary" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          <p className="text-sm font-medium">
                            {isDragActive
                              ? "Drop your image here"
                              : "Drag and drop your token image"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            or click to browse from your computer
                          </p>

                          <p className="mt-3 text-xs text-muted-foreground">
                            PNG, JPG, JPEG or WEBP · Max 5MB
                          </p>
                        </>
                      )}
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name and Symbol */}
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token name</FormLabel>

                    <FormControl>
                      <Input placeholder="e.g. SOLANA" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="e.g. SOL"
                        maxLength={10}
                        {...field}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Decimals */}
              <FormField
                control={form.control}
                name="decimals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimals</FormLabel>

                    <FormControl>
                      <Input type="number" min={0} max={18} {...field} />
                    </FormControl>

                    <FormDescription>
                      Usually 6 decimals is a good default for tokens.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supply</FormLabel>

                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>

                    <FormDescription>
                      Usually 10,000 tokens is a good default.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>

                  <FormControl>
                    <Textarea
                      placeholder="Tell people about your token..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>

                  <FormDescription>
                    A short description of your token.
                  </FormDescription>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Freeze Authority */}
            <FormField
              control={form.control}
              name="revokeFreeze"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-1">
                    <FormLabel>Revoke freeze authority</FormLabel>

                    <FormDescription>
                      Permanently remove the ability to freeze token accounts.
                    </FormDescription>
                  </div>

                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revokeMint"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-1">
                    <FormLabel>Revoke mint authority</FormLabel>

                    <FormDescription>
                      No one will be able to create more tokens anymore.
                    </FormDescription>
                  </div>

                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revokeMetadataUpdate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-1">
                    <FormLabel>Revoke Metadata Update</FormLabel>

                    <FormDescription>
                      No one will be able to modify token metadata anymore.
                    </FormDescription>
                  </div>

                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isUploading || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating token...
                </>
              ) : (
                "Create token"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TokenMint;
