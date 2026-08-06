import Decimal from "decimal.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";

export async function getTokenUsdPrice(mint: string): Promise<Decimal> {
  // 1. Try Jupiter
  try {
    const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`);

    if (res.ok) {
      const data = await res.json();
      const price = data[mint]?.usdPrice;
      if (price) return new Decimal(price);
    }
  } catch {}

  // 2. Fallback to Raydium/Orca pool calculation
  // const poolPrice = await getPriceFromPool(mint);
  // if (poolPrice) return poolPrice;

  return new Decimal(0);
}

export function getTokenUsdPriceFromDevnetPool(
  solAmount: number,
  tokenAmount: number,
  tokenDecimals: number,
  solUsdPrice: number = 180,
): Decimal {
  // const [tokenAccount, solAccount] = await Promise.all([
  //   getAccount(connection, pool.tokenVault),
  //   getAccount(connection, pool.solVault),
  // ]);

  const tokenReserve = new Decimal(tokenAmount.toString()).div(
    new Decimal(10).pow(tokenDecimals),
  );

  const solReserve = new Decimal(solAmount.toString()).div(
    new Decimal(10).pow(9),
  );

  if (tokenReserve.isZero()) return new Decimal(0);

  const tokenPriceInSol = solReserve.div(tokenReserve);
  return tokenPriceInSol.mul(solUsdPrice);
}
