import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { SendTransactionOptions } from "@solana/wallet-adapter-base";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

type SendTransaction = (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SendTransactionOptions,
) => Promise<TransactionSignature>;

// i think mint does not exist yet. first initialize mint then create ata
export const createOrGetATA = async (
  connection: Connection,
  sendTransaction: SendTransaction,
  payer: PublicKey,
  recipient: PublicKey,
  mint: PublicKey,
) => {
  try {
    // Derive ATA
    const ata = await getAssociatedTokenAddress(
      mint,
      recipient,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const accountInfo = await connection.getAccountInfo(ata);
    if (accountInfo) {
      console.log("ATA already exists:", ata.toBase58());
      return ata;
    }

    const {
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    // Create ATA
    const transaction = new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: payer,
    }).add(
      createAssociatedTokenAccountInstruction(
        payer, // payer
        ata, // recipient associated token account
        recipient, // recipient
        mint, // mint
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );

    const signature = await sendTransaction(transaction, connection);

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
