import { env } from "~/env";

export const STELLAR_URL = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";
