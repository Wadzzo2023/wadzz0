import { env } from "~/env";

export const BASE_URL =
    env.NEXT_PUBLIC_STAGE === "prod"
        ? "https://app.wadzzo.com/"
        : "https://app.wadzzo.com/";
