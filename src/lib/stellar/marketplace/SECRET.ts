// Required at this path by package/connect_wallet (trx/deummy.ts verifies wallet sign-ins with it).
import { env } from "~/env";

export const MOTHER_SECRET = env.MOTHER_SECRET;
