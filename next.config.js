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
  // async headers() {
  //   return [
  //     {
  //       // matching all API routes
  //       source: "/api/:path*",
  //       headers: [
  //         { key: "Access-Control-Allow-Credentials", value: "true" },
  //         { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
  //         {
  //           key: "Access-Control-Allow-Methods",
  //           value: "GET,DELETE,PATCH,POST,PUT",
  //         },
  //         {
  //           key: "Access-Control-Allow-Headers",
  //           value:
  //             "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  //         },
  //       ],
  //     },
  //   ];
  // },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
      {
        hostname: "firebasestorage.googleapis.com",
      },
      { hostname: "raw.githubusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "ipfs.io" },
      { hostname: "daisyui.com" },
      { hostname: "picsum.photos" },
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
        // matching all API routes
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
