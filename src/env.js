import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const bool = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

export const env = createEnv({
  server: {
    /** White-label platform this deployment serves; a `Platform.id` (see src/server/platform.ts). */
    PLATFORM_SLUG: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .default("wadzzo"),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXTAUTH_SECRET: process.env.NODE_ENV === "production" ? z.string() : z.string().optional(),
    NEXTAUTH_URL: z.preprocess((str) => process.env.VERCEL_URL ?? str, process.env.VERCEL ? z.string() : z.string().url()),
    STORAGE_SECRET: z.string(),
    MOTHER_SECRET: z.string(),
    RUBY_ACCOUNTS_SECRET: z.string(),
    /**
     * 32-byte key (hex or base64) that encrypts creator issuer secrets at rest.
     * Must be the same in every app that mints (brand-wadzzo, wadzz0, wadzzoAR).
     */
    ISSUER_ENCRYPTION_KEY: z.string().min(32),
    SQUARE_ACCESS_TOKEN: z.string(),
    SQUARE_ENVIRONMENT: z.string(),
    AWS_BUCKET_NAME: z.string(),
    AWS_BUCKET_REGION: z.string(),
    AWS_ACCESS_KEY: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
  },

  client: {
    NEXT_PUBLIC_SITE: z.string(),
    NEXT_PUBLIC_DESC: z.string(),
    NEXT_PUBLIC_URL: z.string(),
    NEXT_PUBLIC_STAGE: z.string(),
    NEXT_PUBLIC_STELLAR_PUBNET: bool,
    NEXT_PUBLIC_ASSET_CODE: z.string(),
    NEXT_PUBLIC_ASSET_ISSUER: z.string(),
    NEXT_PUBLIC_HOME_DOMAIN: z.string(),
    NEXT_PUBLIC_SQUARE_APP_ID: z.string(),
    NEXT_PUBLIC_SQUARE_LOCATION: z.string(),
    /** The brand portal (brand-wadzzo), linked from "Become a creator". */
    NEXT_PUBLIC_BRAND_PORTAL_URL: z.string().url().default("https://brand.wadzzo.com"),
  },

  runtimeEnv: {
    PLATFORM_SLUG: process.env.PLATFORM_SLUG,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    STORAGE_SECRET: process.env.STORAGE_SECRET,
    MOTHER_SECRET: process.env.MOTHER_SECRET,
    RUBY_ACCOUNTS_SECRET: process.env.RUBY_ACCOUNTS_SECRET,
    ISSUER_ENCRYPTION_KEY: process.env.ISSUER_ENCRYPTION_KEY,
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
    SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT,
    AWS_BUCKET_NAME: process.env.NEXT_AWS_BUCKET_NAME,
    AWS_BUCKET_REGION: process.env.NEXT_AWS_BUCKET_REGION,
    AWS_ACCESS_KEY: process.env.NEXT_AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_SITE: process.env.NEXT_PUBLIC_SITE,
    NEXT_PUBLIC_DESC: process.env.NEXT_PUBLIC_DESC,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_STAGE: process.env.NEXT_PUBLIC_STAGE,
    NEXT_PUBLIC_STELLAR_PUBNET: process.env.NEXT_PUBLIC_STELLAR_PUBNET,
    NEXT_PUBLIC_ASSET_CODE: process.env.NEXT_PUBLIC_ASSET_CODE,
    NEXT_PUBLIC_ASSET_ISSUER: process.env.NEXT_PUBLIC_ASSET_ISSUER,
    NEXT_PUBLIC_HOME_DOMAIN: process.env.NEXT_PUBLIC_HOME_DOMAIN,
    NEXT_PUBLIC_SQUARE_APP_ID: process.env.NEXT_PUBLIC_SQUARE_APP_ID,
    NEXT_PUBLIC_SQUARE_LOCATION: process.env.NEXT_PUBLIC_SQUARE_LOCATION,
    NEXT_PUBLIC_BRAND_PORTAL_URL: process.env.NEXT_PUBLIC_BRAND_PORTAL_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
