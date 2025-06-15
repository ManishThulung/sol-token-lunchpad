"use client";
import { useState } from "react";
import { Button } from "../ui/button";

const CreateWallet = ({ seed }: { seed: Buffer<ArrayBufferLike> }) => {
  const [count, setCount] = useState(0);
  // const devirativePath = m/
  const handleClick = () => {
    // const
  };
  return (
    <div>
      <Button onClick={handleClick}>Add Wallet</Button>
    </div>
  );
};

export default CreateWallet;
