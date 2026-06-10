import "mapbox-gl/dist/mapbox-gl.css";

import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Titillium_Web } from "next/font/google";
import Layout from "~/components/layout";
import "~/styles/globals.css";
import "~/styles/music.scss";
import ProgressProvider from "~/components/progress-bar";

const queryClient = new QueryClient();

const PopupImports = dynamic(
  async () =>
    await import("package/connect_wallet/src/components/popup_imports"),
);

const inner = Titillium_Web({ subsets: ["latin"], weight: "400" });
// const avro = Arvo({ subsets: ["latin"], weight: ["400", "700"] });

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ProgressProvider>
          <Layout className={inner.className}>
            <Component {...pageProps} />
          </Layout>
          <PopupImports className={inner.className} />
        </ProgressProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
