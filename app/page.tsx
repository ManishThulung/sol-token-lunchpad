import Mnemonics from "@/components/mnemonics";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CreateWallet from "@/components/wallet/create-wallet";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";
import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";

const page = async () => {
  const cookie = await getCookie("mnemonic", { cookies });
  // Generate a 12-word mnemonic
  const mnemonic = cookie ? cookie : generateMnemonic(128);
  const seed = mnemonicToSeedSync(mnemonic);
  const encodedSeed = bs58.encode(seed);

  return (
    <div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            Mnemonic Phrase (Keep it extra secret)
          </AccordionTrigger>
          <AccordionContent className="max-w-6xl m-auto grid grid-cols-4 gap-8">
            <Mnemonics mnemonic={mnemonic} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <CreateWallet encodedSeed={encodedSeed} />
    </div>
  );
};

export default page;
