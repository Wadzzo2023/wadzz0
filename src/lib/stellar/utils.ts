import { z } from "zod";

export const AccounSchema = z.object({
  publicKey: z.string(),
  secretKey: z.string(),
});

export type AccountType = z.infer<typeof AccounSchema>;
