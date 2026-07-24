"use client";

import TokenMint from "@/components/mint/create-token";
import Transfer from "@/components/modals/transfer";
import { calculateLamports } from "@/lib/lamport";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";

const Page = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [accounts, setAccounts] = useState();

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
    setAccounts(tokens);
    return tokens;
  };

  // useEffect(() => {
  //   if (!publicKey) return;
  //   // const getMyAccounts = async () => {
  //   //   const accounts = await connection.getProgramAccounts(
  //   //     TOKEN_2022_PROGRAM_ID,
  //   //     {
  //   //       filters: [
  //   //         {
  //   //           memcmp: {
  //   //             offset: 4,
  //   //             bytes: publicKey.toBase58(),
  //   //           },
  //   //         },
  //   //       ],
  //   //     },
  //   //   );
  //   //   console.log(accounts, "accountsaccounts");
  //   //   setAccounts(accounts);
  //   // };

  //   // getMyAccounts();

  //   getMyMintAuthorityTokens();
  // }, [publicKey]);

  // useEffect(() => {
  //   if (!publicKey) return;
  //   const authority = publicKey.toBase58();

  //   const items = [
  //     {
  //       interface: "FungibleToken",
  //       id: "3oZ9VVP74ktXHsubJ5DznyYWHunj4UnMz5vTqrFnwt16",
  //       content: {
  //         $schema: "https://schema.metaplex.com/nft1.0.json",
  //         json_uri: "https://rag-chat-lilac.vercel.app/api/metadata/brow",
  //         files: [
  //           {
  //             uri: "https://appsha-bucket.s3.us-east-1.amazonaws.com/1784373637175-cropped.jpg",
  //             cdn_uri:
  //               "https://cdn.helius-rpc.com/cdn-cgi/image//https://appsha-bucket.s3.us-east-1.amazonaws.com/1784373637175-cropped.jpg",
  //             mime: "image/jpeg",
  //           },
  //         ],
  //         metadata: {
  //           description: "My custom token",
  //           json_name: "TOKEN BROW",
  //           name: "TOKEN BROW",
  //           symbol: "BROW",
  //         },
  //         links: {
  //           image:
  //             "https://appsha-bucket.s3.us-east-1.amazonaws.com/1784373637175-cropped.jpg",
  //         },
  //       },
  //       authorities: [
  //         {
  //           address: "4wXY2KfvuwjLaCX7SsB1d8cmKKoyjdqRWX84mBr7gFJ5",
  //           scopes: ["metadata"],
  //         },
  //       ],
  //       compression: {
  //         eligible: false,
  //         compressed: false,
  //         data_hash: "",
  //         creator_hash: "",
  //         asset_hash: "",
  //         tree: "",
  //         seq: 0,
  //         leaf_id: 0,
  //       },
  //       grouping: [],
  //       royalty: {
  //         royalty_model: "creators",
  //         target: null,
  //         percent: 0,
  //         basis_points: 0,
  //         primary_sale_happened: false,
  //         locked: false,
  //       },
  //       creators: [],
  //       ownership: {
  //         frozen: false,
  //         delegated: false,
  //         delegate: null,
  //         ownership_model: "token",
  //         owner: "",
  //       },
  //       supply: null,
  //       mutable: true,
  //       burnt: false,
  //       mint_extensions: {
  //         metadata: {
  //           uri: "https://rag-chat-lilac.vercel.app/api/metadata/brow",
  //           mint: "3oZ9VVP74ktXHsubJ5DznyYWHunj4UnMz5vTqrFnwt16",
  //           name: "TOKEN BROW",
  //           symbol: "BROW",
  //           update_authority: "4wXY2KfvuwjLaCX7SsB1d8cmKKoyjdqRWX84mBr7gFJ5",
  //           additional_metadata: [],
  //         },
  //         metadata_pointer: {
  //           authority: "4wXY2KfvuwjLaCX7SsB1d8cmKKoyjdqRWX84mBr7gFJ5",
  //           metadata_address: "3oZ9VVP74ktXHsubJ5DznyYWHunj4UnMz5vTqrFnwt16",
  //         },
  //       },
  //       token_info: {
  //         supply: 110000000000,
  //         decimals: 9,
  //         token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  //       },
  //     },
  //   ];
  //   const tokens = items.filter(
  //     (asset: any) =>
  //       asset.interface === "FungibleToken" &&
  //       (asset.authorities[0].address === authority ||
  //         asset.mint_extensions?.metadata?.update_authority === authority ||
  //         asset.mint_extensions?.metadata_pointer?.authority === authority),
  //   );
  //   setAccounts(tokens as any);
  // }, [publicKey]);

  const items = [
    {
      interface: "FungibleToken",
      id: "3oZ9VVP74ktXHsubJ5DznyYWHunj4UnMz5vTqrFnwt16",
      content: {
        $schema: "https://schema.metaplex.com/nft1.0.json",
        json_uri: "https://rag-chat-lilac.vercel.app/api/metadata/brow",
        files: [
          {
            uri: "https://appsha-bucket.s3.us-east-1.amazonaws.com/1784373637175-cropped.jpg",
            cdn_uri:
              "https://cdn.helius-rpc.com/cdn-cgi/image//https://appsha-bucket.s3.us-east-1.amazonaws.com/1784373637175-cropped.jpg",
            mime: "image/jpeg",
          },
        ],
        metadata: {
          description: "My custom token",
          json_name: "TOKEN BROW",
          name: "TOKEN BROW",
          symbol: "BROW",
        },
        links: {
          image:
            "https://appsha-bucket.s3.us-east-1.amazonaws.com/1784373637175-cropped.jpg",
        },
      },
      authorities: [
        {
          address: "4wXY2KfvuwjLaCX7SsB1d8cmKKoyjdqRWX84mBr7gFJ5",
          scopes: ["metadata"],
        },
      ],
      compression: {
        eligible: false,
        compressed: false,
        data_hash: "",
        creator_hash: "",
        asset_hash: "",
        tree: "",
        seq: 0,
        leaf_id: 0,
      },
      grouping: [],
      royalty: {
        royalty_model: "creators",
        target: null,
        percent: 0,
        basis_points: 0,
        primary_sale_happened: false,
        locked: false,
      },
      creators: [],
      ownership: {
        frozen: false,
        delegated: false,
        delegate: null,
        ownership_model: "token",
        owner: "",
      },
      supply: null,
      mutable: true,
      burnt: false,
      mint_extensions: {
        metadata: {
          uri: "https://rag-chat-lilac.vercel.app/api/metadata/brow",
          mint: "3oZ9VVP74ktXHsubJ5DznyYWHunj4UnMz5vTqrFnwt16",
          name: "TOKEN BROW",
          symbol: "BROW",
          update_authority: "4wXY2KfvuwjLaCX7SsB1d8cmKKoyjdqRWX84mBr7gFJ5",
          additional_metadata: [],
        },
        metadata_pointer: {
          authority: "4wXY2KfvuwjLaCX7SsB1d8cmKKoyjdqRWX84mBr7gFJ5",
          metadata_address: "3oZ9VVP74ktXHsubJ5DznyYWHunj4UnMz5vTqrFnwt16",
        },
      },
      token_info: {
        supply: 110000000000,
        decimals: 9,
        token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      },
    },
  ];

  return (
    <div className="flex gap-6 flex-col">
      <TokenMint />

      <div className="flex flex-col gap-4">
        {items &&
          items?.map((token) => {
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
