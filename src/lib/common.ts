
import { env } from "~/env";

export const BASE_URL = env.NEXT_PUBLIC_STAGE === "dev" ? "http://localhost:3000" : "https://app.wadzzo.com";
