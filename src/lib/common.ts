
import { env } from "~/env";

export const BASE_URL = env.NEXT_PUBLIC_STAGE === "dev" ? "https://dev.wadzzo.com/" : "https://app.wadzzo.com";
