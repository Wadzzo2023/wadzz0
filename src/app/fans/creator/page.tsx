import { redirect } from "next/navigation";

import { env } from "~/env";

/** The old creator dashboard now lives in the brand portal. */
export default function OldCreatorDashboard() {
  redirect(env.NEXT_PUBLIC_BRAND_PORTAL_URL);
}
