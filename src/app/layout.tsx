// Self-hosted fonts (same families as the brand portal and fan apps): Sora body, Chakra Petch display.
import "@fontsource-variable/sora";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "~/styles/globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { env } from "~/env";

import { Providers } from "./providers";

const site = env.NEXT_PUBLIC_SITE;

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_URL),
  title: { default: `${site} — Collect drops from the brands you love`, template: `%s · ${site}` },
  description: env.NEXT_PUBLIC_DESC,
  applicationName: site,
  icons: { icon: "/favicon.ico" },
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site, images: ["/images/logo.png"] },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0a100d" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes sets the class before hydration.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
