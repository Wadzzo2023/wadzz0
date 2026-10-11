"use client";

import { Layers } from "lucide-react";

import { SignedIn } from "~/components/shell/sign-in-prompt";

import { CollectionView } from "./collection-view";

export function CollectionPage() {
  return (
    <SignedIn icon={Layers} title="Your collection" description="Sign in to see the items you own and resell them.">
      <CollectionView />
    </SignedIn>
  );
}
