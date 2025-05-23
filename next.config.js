/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import analyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = analyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["three"],
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: "wadzzo.s3.amazonaws.com" },
      {
        hostname: "utfs.io",
      },
      {
        hostname: "gateway.pinata.cloud",
      },
      { hostname: "app.wadzzo.com" },
      {
        hostname: "firebasestorage.googleapis.com",
      },
      { hostname: "raw.githubusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "ipfs.io" },
      { hostname: "daisyui.com" },
      { hostname: "picsum.photos" },
      { hostname: `${process.env.NEXT_AWS_BUCKET_NAME}.s3.amazonaws.com` },
      {
        hostname: `${process.env.NEXT_AWS_BUCKET_NAME}.s3.us-east-1.amazonaws.com`,
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/.well-known/stellar.toml",
        destination: "/api/toml",
        // persistance: true
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://main.d20qrrwbkiopzh.amplifyapp.com",
          }, // replace this your actual origin
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

export default withBundleAnalyzer(config);
