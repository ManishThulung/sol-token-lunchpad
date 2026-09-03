import Decimal from "decimal.js";

export interface ParsedTrade {
  trader: string;
  side: "BUY" | "SELL";
  amountIn: Decimal;
  amountOut: Decimal;
  tokenInMint: string;
  tokenOutMint: string;
  feeAmount: Decimal;
  usdVolume: Decimal;
  price: Decimal;
  slot: bigint;
  timestamp: Date;
}
