/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["three"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  /** Old fan-app URLs → their new homes (bookmarks and shared links keep working). */
  async redirects() {
    return [
      { source: "/assets", destination: "/collection", permanent: true },
      { source: "/fans/home", destination: "/feed", permanent: true },
      { source: "/fans/posts/:id", destination: "/posts/:id", permanent: true },
      { source: "/bounty", destination: "/bounties", permanent: true },
      { source: "/bounty/:id", destination: "/bounties/:id", permanent: true },
      { source: "/walletBalance", destination: "/wallet", permanent: true },
      { source: "/recharge", destination: "/wallet", permanent: true },
      { source: "/notification", destination: "/notifications", permanent: true },
      { source: "/me", destination: "/settings", permanent: true },
      { source: "/music/:path*", destination: "/marketplace", permanent: true },
    ];
  },

  async rewrites() {
    return [{ source: "/.well-known/stellar.toml", destination: "/api/toml" }];
  },

  async headers() {
    return [
      {
        // The legacy REST endpoints (/api/game/*) are called by the old mobile app.
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://main.d20qrrwbkiopzh.amplifyapp.com" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default config;
