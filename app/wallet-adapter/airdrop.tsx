import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { FC, useCallback, useState } from "react";
import { toast } from "sonner";

export const AirdropSol: FC = () => {
  const [value, setValue] = useState<number>(1);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleClick = useCallback(async () => {
    try {
      if (!publicKey) throw new WalletNotConnectedError();

      const walletAddress = new PublicKey(publicKey);

      const signature = await connection.requestAirdrop(
        walletAddress,
        value * LAMPORTS_PER_SOL,
      );
      if (signature) {
        toast.success(`${value} SOL airdrop successful.`);
      }
    } catch (error: any) {
      console.log(JSON.stringify(error), "airdrop error");

      if (error instanceof WalletNotConnectedError) {
        toast.error("Wallent not connected");
        return;
      }
      toast.error("Something went wrong");
    }
  }, [publicKey, sendTransaction, connection]);

  return (
    <>
      <Label htmlFor="airdrop">Airdrop SOL</Label>
      <Input
        id="airdrop"
        placeholder="5"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <Button onClick={handleClick}>Send</Button>
    </>
  );
};

// show balance
// sign transaction
// send solana

// mint token
// attach metadata
// show token balance
// send token balance
