"use client";

import { Activity } from "lucide-react";

import { SignedIn } from "~/components/shell/sign-in-prompt";
import { useRequireAuth } from "~/hooks/use-require-auth";

import { ActivityView } from "./activity-view";

export function ActivityPage() {
  const { session } = useRequireAuth();
  return (
    <SignedIn icon={Activity} title="Your activity" description="Sign in to see your purchases, sales and listings.">
      {session && <ActivityView me={session.user.id} />}
    </SignedIn>
  );
}
