import type { Metadata } from "next";

import { SignupView } from "~/components/static/signup-view";

export const metadata: Metadata = { title: "Sign up", alternates: { canonical: "/signup" } };

export default function Page() {
  return <SignupView />;
}
