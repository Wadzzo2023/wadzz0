import { env } from "~/env";

export const BASE_URL =
  env.NEXT_PUBLIC_STAGE === "dev"
    ? "https://dev.wadzzo.com/"
    : "https://app.wadzzo.com";
// export const BASE_URL = "https://8bfa-103-153-66-242.ngrok-free.app";
