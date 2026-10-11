"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SignedIn } from "~/components/shell/sign-in-prompt";
import { UserPlus } from "lucide-react";

/** Old /signup links: show the sign-in prompt, then go home once signed in. */
export function SignupView() {
  return (
    <SignedIn icon={UserPlus} title="Join Wadzzo" description="Sign up with email, Google, Facebook or Apple — or connect your own Stellar wallet.">
      <GoHome />
    </SignedIn>
  );
}

function GoHome() {
  const router = useRouter();
  useEffect(() => router.replace("/"), [router]);
  return null;
}
