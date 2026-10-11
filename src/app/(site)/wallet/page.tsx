import type { Metadata } from "next";

import { WalletPage } from "~/components/wallet/wallet-page";

export const metadata: Metadata = { title: "Wallet", robots: { index: false } };

export default function Page() {
  return <WalletPage />;
}
