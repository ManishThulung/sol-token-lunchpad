import React from "react";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CreateWallet from "@/components/wallet/create-wallet";

const page = () => {
  // Generate a 12-word mnemonic
  const mnemonic = generateMnemonic(128);
  const seed = mnemonicToSeedSync(mnemonic);
  const mnemonicPhrase = mnemonic.split(/\s+/);
  return (
    <div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            Mnemonic Phrase (Keep it extra secret)
          </AccordionTrigger>
          <AccordionContent className="max-w-6xl m-auto grid grid-cols-4 gap-8">
            {mnemonicPhrase.map((phrase, i) => (
              <div
                key={phrase}
                className="flex gap-2 justify-start items-center bg-black px-8 py-4 text-white rounded-lg text-xl font-semibold"
              >
                <span>{i + 1}.</span> <span>{phrase}</span>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <CreateWallet seed={seed} />
    </div>
  );
};

export default page;
