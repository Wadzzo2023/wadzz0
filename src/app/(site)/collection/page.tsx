import { Layers } from "lucide-react";
import type { Metadata } from "next";

import { CollectionView } from "~/components/collection/collection-view";
import { SignedIn } from "~/components/shell/sign-in-prompt";

export const metadata: Metadata = { title: "My collection", robots: { index: false } };

export default function CollectionPage() {
  return (
    <SignedIn icon={Layers} title="Your collection" description="Sign in to see the items you own and resell them.">
      <CollectionView />
    </SignedIn>
  );
}
