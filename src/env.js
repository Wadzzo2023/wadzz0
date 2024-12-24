import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    STORAGE_SECRET: z.string(),
    MOTHER_SECRET: z.string(),
    PINATA_JWT: z.string(),
    // squire
    SQUARE_ACCESS_TOKEN: z.string(),
    SQUARE_ENVIRONMENT: z.string(),
    // AWS
    AWS_BUCKET_NAME: z.string(),
    AWS_BUCKET_REGION: z.string(),
    AWS_ACCESS_KEY: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SITE: z.string(),
    NEXT_PUBLIC_DESC: z.string(),
    NEXT_PUBLIC_URL: z.string(),
    NEXT_PUBLIC_STAGE: z.string(),
    NEXT_PUBLIC_PLATFORM_CREATOR_TERM: z.string(),
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_STELLAR_PUBNET: z
      .string()
      .refine((s) => s === "true" || s === "false")
      .transform((s) => s === "true"),
    NEXT_PUBLIC_ASSET_CODE: z.string(),
    NEXT_PUBLIC_ASSET_ISSUER: z.string(),
    NEXT_PUBLIC_LOG_ENABLE: z
      .string()
      .refine((s) => s === "true" || s === "false")
      .transform((s) => s === "true"),

    // squire
    NEXT_PUBLIC_SQUARE_APP_ID: z.string(),
    NEXT_PUBLIC_SQUARE_LOCATION: z.string(),
    NEXT_PUBLIC_HOME_DOMAIN: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
    NEXT_PUBLIC_PLATFORM_CREATOR_TERM:
      process.env.NEXT_PUBLIC_PLATFORM_CREATOR_TERM,
    NEXT_PUBLIC_DESC: process.env.NEXT_PUBLIC_DESC,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_STELLAR_PUBNET: process.env.NEXT_PUBLIC_STELLAR_PUBNET,
    NEXT_PUBLIC_STAGE: process.env.NEXT_PUBLIC_STAGE,
    NEXT_PUBLIC_ASSET_CODE: process.env.NEXT_PUBLIC_ASSET_CODE,
    NEXT_PUBLIC_ASSET_ISSUER: process.env.NEXT_PUBLIC_ASSET_ISSUER,
    NEXT_PUBLIC_LOG_ENABLE: process.env.NEXT_PUBLIC_LOG_ENABLE,
    NEXT_PUBLIC_HOME_DOMAIN: process.env.NEXT_PUBLIC_HOME_DOMAIN,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    MOTHER_SECRET: process.env.MOTHER_SECRET,
    STORAGE_SECRET: process.env.STORAGE_SECRET,
    PINATA_JWT: process.env.PINATA_JWT,
    // squire
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
    SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT,
    NEXT_PUBLIC_SQUARE_APP_ID: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
    NEXT_PUBLIC_SQUARE_LOCATION: process.env.NEXT_PUBLIC_SQUARE_LOCATION,
    // AWS
    AWS_BUCKET_NAME: process.env.NEXT_AWS_BUCKET_NAME,
    AWS_BUCKET_REGION: process.env.NEXT_AWS_BUCKET_REGION,
    AWS_ACCESS_KEY: process.env.NEXT_AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
