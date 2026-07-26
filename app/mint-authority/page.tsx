"use client";

import Transfer from "@/components/modals/transfer";
import { calculateLamports } from "@/lib/lamport";
import { TokenAsset } from "@/types/token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

const Page = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenAsset[]>([]);

  const getMyMintAuthorityTokens = async () => {
    if (!publicKey) {
      throw new Error("Wallet not connected");
    }
    const authority = publicKey.toBase58();

    const response = await fetch(
      `https://devnet.helius-rpc.com/?api-key=71dda314-5441-4da2-9a7a-d98ff4d687f1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getAssetsByAuthority",
          params: {
            authorityAddress: authority,
            page: 1,
            limit: 1000,
          },
        }),
      },
    );

    const { result } = await response.json();
    console.log(JSON.stringify(result), "result");

    const tokens = result.items.filter(
      (asset: any) =>
        asset.interface === "FungibleToken" &&
        (asset.authorities[0].address === authority ||
          asset.mint_extensions?.metadata?.update_authority === authority ||
          asset.mint_extensions?.metadata_pointer?.authority === authority),
    );
    setTokens(tokens);
    return tokens;
  };

  useEffect(() => {
    if (!publicKey) return;
    // const getMyAccounts = async () => {
    //   const accounts = await connection.getProgramAccounts(
    //     TOKEN_2022_PROGRAM_ID,
    //     {
    //       filters: [
    //         {
    //           memcmp: {
    //             offset: 4,
    //             bytes: publicKey.toBase58(),
    //           },
    //         },
    //       ],
    //     },
    //   );
    //   console.log(accounts, "accountsaccounts");
    //   setAccounts(accounts);
    // };

    // getMyAccounts();

    getMyMintAuthorityTokens();
  }, [publicKey]);

  return (
    <div className="flex gap-6 flex-col">
      Mint authority
      <div className="flex flex-col gap-4">
        {tokens &&
          tokens?.map((token) => {
            const lamports = calculateLamports(token.token_info.decimals);
            const totalSupply = token.token_info.supply / lamports;

            return (
              <div
                key={token.token_info.token_program}
                className="flex gap-10 items-center"
              >
                <p className="text-base font-semibold">
                  {token.mint_extensions.metadata.name}
                  <span className="text-[#c5c5c5] ml-2">
                    {token.mint_extensions.metadata.symbol}
                  </span>
                </p>
                <p>{totalSupply}</p>
                <Transfer
                  title="Mint"
                  type="MINT"
                  mint={new PublicKey(token.id)}
                  decimals={token.token_info.decimals}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Page;
