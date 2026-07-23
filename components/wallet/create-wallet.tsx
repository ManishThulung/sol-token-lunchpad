"use client";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { HDNodeWallet } from "ethers";
import { useState } from "react";
import nacl from "tweetnacl";
import { Button } from "../ui/button";
import Account from "./account";
import Transfer from "./transfer-sol-raw";
import WalletDetail from "./details";

type WalletAccount = {
  privateKey: string;
  publicKey: string;
};

// const CreateWallet = ({ encodedSeed }: { encodedSeed: string }) => {
//   const connection = new Connection(clusterApiUrl("devnet"));
//   const router = useRouter();
//   const [seed, setSeed] = useState<Uint8Array<ArrayBufferLike> | null>(null);
//   const [count, setCount] = useState(1);
//   const [accounts, setAccounts] = useState<WalletAccount[]>([]);

//   const handleClick = () => {
//     if (!seed) return;

//     const path = `m/44'/501'/${count}'/0'`; // This is the derivation path for solana
//     const derivedSeed = derivePath(path, seed.toString()).key;
//     const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;

//     const privateKey = bs58.encode(secret);
//     const publicKey = Keypair.fromSecretKey(secret).publicKey.toBase58();
//     setCount((c) => c + 1);

//     setAccounts((prev) => [...prev, { privateKey, publicKey }]);
//   };

//   useEffect(() => {
//     const cookieValue = getCookie("accounts");
//     if (cookieValue && typeof cookieValue === "string") {
//       try {
//         const parsed = JSON.parse(cookieValue);
//         if (Array.isArray(parsed)) {
//           setAccounts(parsed);
//           setCount(parsed.length + 1);
//         }
//       } catch (err) {
//         console.error("Invalid cookie format:", err);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (encodedSeed) {
//       const decodedSeed = bs58.decode(encodedSeed);
//       setSeed(decodedSeed);
//     }
//   }, [encodedSeed]);

//   useEffect(() => {
//     setCookie("accounts", JSON.stringify(accounts));
//   }, [accounts]);

//   const handleMint = (account: WalletAccount) => {
//     setCookie("activeAccount", JSON.stringify(account));
//     router.push("/token-mint");
//   };

//   async function handleAirdrop(publicKey: string) {
//     const airdropSignature = await connection.requestAirdrop(
//       new PublicKey(publicKey),
//       LAMPORTS_PER_SOL
//     );

//     await connection.confirmTransaction(airdropSignature);
//   }
//   return (
//     <div>
//       <Button onClick={handleClick}>Add Wallet</Button>
//       <div className="flex gap-8 flex-col ">
//         {accounts &&
//           accounts.length > 0 &&
//           accounts.map((account, i) => (
//             <div key={account.publicKey}>
//               <p>Account {i + 1}</p>
//               <Account
//                 privateKey={account.privateKey}
//                 publicKey={account.publicKey}
//               />
//               <Button onClick={() => handleMint(account)}>Mint token</Button>
//               <Button onClick={() => handleAirdrop(account.publicKey)}>
//                 Airdrop SOL
//               </Button>
//             </div>
//           ))}
//       </div>
//     </div>
//   );
// };

const CreateWallet = ({ encodedSeed }: { encodedSeed: string }) => {
  const [solAccounts, setSolAccounts] = useState<WalletAccount[]>([]);
  const [ethAccounts, setEthAccounts] = useState<WalletAccount[]>([]);

  const handleClick = (type: "ETH" | "SOL") => {
    if (!encodedSeed) return null; // toast to alert user
    const seed = bs58.decode(encodedSeed);

    if (type === "SOL") {
      const path = `m/44'/501'/${solAccounts.length}'/0'`;

      const derivedSeed = derivePath(path, seed.toString()).key;
      const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;

      const privateKey = bs58.encode(secret);
      const publicKey = Keypair.fromSecretKey(secret).publicKey.toBase58();
      setSolAccounts((prev) => [...prev, { privateKey, publicKey }]);
    } else {
      const path = `m/44'/60'/0'/0'/${ethAccounts.length}'`;
      const wallet = HDNodeWallet.fromSeed(seed).derivePath(path);

      const privateKey = wallet.privateKey;
      const publicKey = wallet.address;
      setEthAccounts((prev) => [...prev, { privateKey, publicKey }]);
    }
  };

  return (
    <div className="flex justify-between">
      <div className="flex gap-6 flex-col">
        <Button onClick={() => handleClick("SOL")}>Add SOL Wallet</Button>
        <div className="flex gap-8 flex-col ">
          {solAccounts &&
            solAccounts.length > 0 &&
            solAccounts.map((account, i) => (
              <div key={account.publicKey}>
                <p>Account {i + 1}</p>
                <Account publicKey={account.publicKey} />
                <div className="flex gap-4 mt-3">
                  <WalletDetail
                    publicKey={account.publicKey}
                    privateKey={account.privateKey}
                  />

                  <Transfer privateKey={account.privateKey} />
                </div>
                {/* <Button onClick={() => handleMint(account)}>Mint token</Button>
              <Button onClick={() => handleAirdrop(account.publicKey)}>
                Airdrop SOL
              </Button> */}
              </div>
            ))}
        </div>
      </div>
      <div className="flex gap-6 flex-col">
        <Button onClick={() => handleClick("ETH")}>Add ETH Wallet</Button>
        <div className="flex gap-8 flex-col ">
          {ethAccounts &&
            ethAccounts.length > 0 &&
            ethAccounts.map((account, i) => (
              <div key={account.publicKey}>
                <p>Account {i + 1}</p>
                <Account publicKey={account.publicKey} />
                {/* <Button onClick={() => handleMint(account)}>Mint token</Button>
              <Button onClick={() => handleAirdrop(account.publicKey)}>
                Airdrop SOL
              </Button> */}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CreateWallet;
