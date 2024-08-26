import { z } from "zod";

const PinLocation = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),

  location: z.object({
    creator: z.object({ name: z.string() }),
    title: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),

  createdAt: z.date(),
  id: z.string(),
});

export type PinLocation = z.infer<typeof PinLocation>;
