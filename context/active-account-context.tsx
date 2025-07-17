"use client";

import { createContext, useContext, useState } from "react";

interface IactiveAccount {
  secretKey: Uint8Array<ArrayBufferLike>;
  publicKey: Uint8Array<ArrayBufferLike>;
}
export interface ContextType {
  activeAccount: IactiveAccount | null;
  setActiveAccount: React.Dispatch<React.SetStateAction<IactiveAccount | null>>;
}
interface Iprops {
  children: React.ReactNode;
}

const ActiveAccountContext = createContext<ContextType>({
  activeAccount: null,
  setActiveAccount: () => {
    return;
  },
});

const AccountContextProvider = ({ children }: Iprops) => {
  const [activeAccount, setActiveAccount] = useState<IactiveAccount | null>(
    null
  );

  return (
    <ActiveAccountContext.Provider
      value={{
        activeAccount,
        setActiveAccount,
      }}
    >
      {children}
    </ActiveAccountContext.Provider>
  );
};

const useActiveAccountContext = () => {
  const context = useContext(ActiveAccountContext);

  if (context) {
    return context;
  }

  throw new Error(
    `useActiveAccountContext must be used within a AccountContextProvider`
  );
};

export { AccountContextProvider, useActiveAccountContext };
