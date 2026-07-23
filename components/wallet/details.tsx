"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getSolBalance } from "@/lib/sol";
import { useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { PublicKey } from "@solana/web3.js";

const WalletDetail = ({
  publicKey,
  privateKey,
}: {
  publicKey: string;
  privateKey: string;
}) => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const getBalance = async () => {
      const balance = await getSolBalance(new PublicKey(publicKey));
      setBalance(balance);
    };
    getBalance();
  });
  return (
    <Dialog>
      <DialogTrigger>
        <Button>Details</Button>
      </DialogTrigger>
      <DialogContent className="w-fit">
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
          <Separator className="mb-8" />

          <DialogDescription className="flex flex-col gap-4">
            <span className="flex justify-between items-center">
              <span>Address</span> <span>{publicKey}</span>
            </span>
            <Separator />

            <span className="flex justify-between items-center">
              <span className="mr-10">PrivateKey</span>{" "}
              <span>{privateKey}</span>
            </span>
            <Separator />

            <span className="flex justify-between items-center">
              <span>Balance</span> <span>{balance} SOL</span>
            </span>
            <Separator />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default WalletDetail;
