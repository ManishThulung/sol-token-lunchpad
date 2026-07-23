"use client";

import {
  getMint,
  getTokenMetadata,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import Transfer from "../modals/transfer";

interface IToken {
  tokenAccount: string;
  mint: string;
  balance: any;
  rawBalance: any;
  decimals: any;
  supply: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  metadata: {
    name: string;
    symbol: string;
    uri: string;
    updateAuthority: string | null;
    additionalMetadata: (readonly [string, string])[];
  } | null;
}
[];

const Detail = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<IToken[]>([]);

  async function getTokens() {
    if (!publicKey) return;

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: TOKEN_2022_PROGRAM_ID,
      },
    );

    const tokens = await Promise.all(
      tokenAccounts.value.map(async ({ pubkey, account }) => {
        const parsedInfo = account.data.parsed.info;

        const mintAddress = new PublicKey(parsedInfo.mint);

        const [mintInfo, metadata] = await Promise.all([
          getMint(connection, mintAddress, "confirmed", TOKEN_2022_PROGRAM_ID),

          getTokenMetadata(
            connection,
            mintAddress,
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
          ),
        ]);

        return {
          // Token account information
          tokenAccount: pubkey.toString(),

          // Mint information
          mint: mintAddress.toString(),
          balance: parsedInfo.tokenAmount.uiAmount,
          rawBalance: parsedInfo.tokenAmount.amount,
          decimals: parsedInfo.tokenAmount.decimals,

          // Mint info
          supply: mintInfo.supply.toString(),
          mintAuthority: mintInfo.mintAuthority?.toString() ?? null,
          freezeAuthority: mintInfo.freezeAuthority?.toString() ?? null,

          // Token-2022 metadata
          metadata: metadata
            ? {
                name: metadata.name,
                symbol: metadata.symbol,
                uri: metadata.uri,
                updateAuthority: metadata.updateAuthority?.toString() ?? null,
                additionalMetadata: metadata.additionalMetadata,
              }
            : null,
        };
      }),
    );
    setTokens(tokens);
  }

  useEffect(() => {
    if (!publicKey) return;

    getTokens();
  }, [publicKey]);

  return (
    <div className="flex gap-6 flex-col">
      <div className="flex gap-8 flex-col">
        <p className="text-xl font-bold">My Tokens</p>
        <div className="flex flex-col gap-4">
          {tokens &&
            tokens.map((token) => (
              <div key={token.mint} className="flex gap-10 items-center">
                <p className="text-base font-semibold">
                  {token.metadata?.name}{" "}
                  <span className="text-[#c5c5c5] ml-2">
                    {token.metadata?.symbol}
                  </span>
                </p>
                <p>{token.balance}</p>
                <Transfer
                  title="Send Token"
                  type="TOKEN"
                  mint={new PublicKey(token.mint)}
                  decimals={token.decimals}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Detail;
