"use client";

import Transfer from "@/components/modals/transfer";
import Detail from "@/components/wallet-adapter/detail";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function Wallet() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const getBalance = async () => {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    };
    getBalance();
  }, [publicKey]);
  return (
    <div className="flex gap-20 flex-col">
      <div className="flex justify-between items-center">
        {publicKey && (
          <p className="min-w-60 text-lg font-bold">Balance: {balance} SOL</p>
        )}
        <div className="flex gap-4 w-full justify-end">
          {publicKey && <Transfer type="SOL" title="Transfer" />}
          <WalletMultiButton />
          <WalletDisconnectButton />
        </div>
      </div>
      <Detail />
    </div>
  );
}
