import { Raydium, SignAllTransactions } from "@raydium-io/raydium-sdk-v2";

import type { Connection, PublicKey } from "@solana/web3.js";

export const createRaydium = async ({
  connection,
  owner,
  signAllTransactions,
}: {
  connection: Connection;
  owner: PublicKey;
  signAllTransactions: SignAllTransactions;
  // signAllTransactions: (
  //   transactions: SignAllTransactions,
  // ) => Promise<SignAllTransactions>;
}) => {
  return Raydium.load({
    connection,
    owner,
    cluster: "devnet",
    disableFeatureCheck: true,
    blockhashCommitment: "confirmed",
    signAllTransactions,
    // signAllTransactions,
    // apiHost: "https://api-v3-devnet.raydium.io",
    // txVersion: TxVersion.V0,
  });
};
