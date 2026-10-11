import type { Metadata } from "next";

import { CollectionPage } from "~/components/collection/collection-page";

export const metadata: Metadata = { title: "My collection", robots: { index: false } };

export default function Page() {
  return <CollectionPage />;
}
