"use client";

import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import { AirdropSol } from "./airdrop";
import Detail from "./detail";

export default function Wallet() {
  return (
    <div className="flex gap-6 flex-col">
      <div className="flex gap-4 w-full justify-end">
        <WalletMultiButton />
        <WalletDisconnectButton />
      </div>
      <AirdropSol />
      <Detail />
    </div>
  );
}
