import { Raydium, SignAllTransactions } from "@raydium-io/raydium-sdk-v2";
import type { Connection as ConnectionType, PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";

export const createRaydium = async ({
  connection,
  owner,
  signAllTransactions,
}: {
  connection: ConnectionType;
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

let raydium: Raydium | null = null;

export async function getRaydium() {
  if (raydium) return raydium;

  const connection = new Connection(
    "https://api.devnet.solana.com/",
    "confirmed",
  );

  raydium = await Raydium.load({
    connection,
    cluster: "devnet", // or "mainnet"
    disableFeatureCheck: true,
    disableLoadToken: true,
  });

  return raydium;
}
