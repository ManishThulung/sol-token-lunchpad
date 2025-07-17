"use client";

import { setCookie } from "cookies-next/client";

const Mnemonics = ({ mnemonic }: { mnemonic: string }) => {
  const mnemonicPhrase = mnemonic.split(/\s+/);

  setCookie("mnemonic", mnemonic);
  return (
    <>
      {mnemonicPhrase.map((phrase, i) => (
        <div
          key={phrase + i}
          className="flex gap-2 justify-start items-center bg-black px-8 py-4 text-white rounded-lg text-xl font-semibold"
        >
          <span>{i + 1}.</span> <span>{phrase}</span>
        </div>
      ))}
    </>
  );
};

export default Mnemonics;
