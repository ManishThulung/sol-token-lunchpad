"use client";

import { Button } from "@/components/ui/button";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useState } from "react";

const ClientPage = ({ secret }: { secret: any }) => {
  const connection = new Connection(clusterApiUrl("devnet"), {
    commitment: "confirmed",
  });
  const payer = Keypair.fromSecretKey(secret);
  const mintAthority = payer.publicKey;
  const mintKeypair = Keypair.generate();

  const [receiver, setReceiver] = useState("");

  const handleClick = async () => {
    await createMint(
      connection,
      payer,
      mintAthority,
      null,
      6,
      mintKeypair,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  };

  const mintAddress = "DF3nJgGb8b15cLU2EXz3tUA7HE99NqGNzWi64cL5Da2W";

  const handleSend = async () => {
    const transaction = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      new PublicKey(mintAddress),
      new PublicKey(receiver),
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const mint = await mintTo(
      connection,
      payer,
      new PublicKey(mintAddress),
      transaction.address,
      payer,
      100,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    console.log(mint, "mintmint");
  };
  return (
    <div>
      ClientPage
      {/* interact with data */}
      <Button onClick={handleClick}>create mint</Button>
      <h1 className="mt-10">send token to:</h1>
      <input
        placeholder="Enter the address"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
      />
      <Button onClick={handleSend}>Send Token</Button>
    </div>
  );
};

export default ClientPage;
