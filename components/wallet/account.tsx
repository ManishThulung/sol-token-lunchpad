"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Eye, EyeOff } from "lucide-react";

const Account = ({
  privateKey,
  publicKey,
}: {
  privateKey: string;
  publicKey: string;
}) => {
  const [isView, setIsView] = useState<boolean>(false);
  return (
    <div className="flex gap-2 flex-col">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <p>Private Key: </p>
          <span>{isView ? privateKey : "................"}</span>
        </div>
        <Button onClick={() => setIsView(!isView)}>
          {isView ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <p>Public Key: </p>
        <span>{publicKey}</span>
      </div>
    </div>
  );
};

export default Account;
