"use client";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { useState } from "react";
import nacl from "tweetnacl";
import { Button } from "../ui/button";

type WalletAccount = {
  privateKey: string;
  publicKey: string;
};

const CreateWallet = ({ seed }: { seed: Buffer<ArrayBufferLike> }) => {
  const [count, setCount] = useState(1);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);

  const handleClick = () => {
    const path = `m/44'/501'/${count}'/0'`; // This is the derivation path for solana
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;

    const privateKey = bs58.encode(secret);
    const publicKey = Keypair.fromSecretKey(secret).publicKey.toBase58();
    setCount((c) => c + 1);

    setAccounts((prev) => [...prev, { privateKey, publicKey }]);
  };
  return (
    <div>
      <Button onClick={handleClick}>Add Wallet</Button>
      <div className="flex gap-8 flex-col ">
        {accounts &&
          accounts.length > 0 &&
          accounts.map((account) => (
            <div key={account.publicKey} className="flex gap-2 flex-col">
              <p>Private Key: {account.privateKey}</p>
              <p>Publick Key: {account.publicKey}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CreateWallet;
