// Self-hosted fonts: Sora body, Anton display, Permanent Marker for hand-written notes.
import "@fontsource-variable/sora";
import "@fontsource/anton/400.css";
import "@fontsource/permanent-marker/400.css";
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
  themeColor: "#10160e",
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
