import { z } from "zod";

export const creatorExtraFiledsSchema = z
  .object({
    navPermission: z.boolean().optional(),
  })
  .optional()
  .nullable();

export type CreatorExtraFields = z.infer<typeof creatorExtraFiledsSchema>;
