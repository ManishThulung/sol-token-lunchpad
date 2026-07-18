import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));

export async function getSolBalance(publicKey: PublicKey) {
  const address = new PublicKey(publicKey);
  const balance = await connection.getBalance(address);
  return balance / LAMPORTS_PER_SOL;
}

export async function transferSol(
  fromKeypair: Keypair,
  to: string,
  amount: number,
) {
  const transferTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(to),
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transferTransaction,
    [fromKeypair],
  );
  return signature;
}
