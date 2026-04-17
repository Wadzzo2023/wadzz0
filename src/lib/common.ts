
import { env } from "~/env";

export const BASE_URL = env.NEXT_PUBLIC_STAGE === "dev" ? "https://annamae-macrostylous-ari.ngrok-free.dev" : "https://brand.wadzzo.com";
