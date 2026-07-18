"use client";

import {
  createInitializeInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  ExtensionType,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { pack } from "@solana/spl-token-metadata";

const TokenMint = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleClick = async () => {
    try {
      if (!publicKey) throw new WalletNotConnectedError();
      const name = "TOKEN BROW";
      const symbol = "BROW";
      const uri = "https://rag-chat-lilac.vercel.app/api/metadata/brow";

      const mintKeypair = Keypair.generate();

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

      const {
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

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
          9,
          publicKey,
          null,
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
    <div>
      TokenMint
      <Button onClick={handleClick}>Mint Token</Button>
    </div>
  );
};

export default TokenMint;
