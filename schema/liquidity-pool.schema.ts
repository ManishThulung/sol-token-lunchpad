// schemas/liquidity-pool.schema.ts

import { z } from "zod";

export const liquidityPoolSchema = z.object({
  tokenAmount: z
    .string()
    .min(1, "Token amount is required")
    .refine(
      (value) => {
        const amount = Number(value);
        return Number.isFinite(amount) && amount > 0;
      },
      {
        message: "Enter a valid token amount",
      },
    ),

  solAmount: z
    .string()
    .min(1, "SOL amount is required")
    .refine(
      (value) => {
        const amount = Number(value);
        return Number.isFinite(amount) && amount > 0;
      },
      {
        message: "Enter a valid SOL amount",
      },
    ),
});

export type LiquidityPoolFormValues = z.infer<typeof liquidityPoolSchema>;
