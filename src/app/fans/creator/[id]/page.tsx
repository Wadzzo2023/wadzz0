import { permanentRedirect, redirect } from "next/navigation";

import { env } from "~/env";

/** Old creator-dashboard pages moved to the brand portal; old profile links go to the new creator page. */
const DASHBOARD = new Set(["bounty", "gift", "music", "notification", "posts", "redeem", "settings", "store", "widget-settings"]);

export default async function OldCreatorLink({ params }: PageProps<"/fans/creator/[id]">) {
  const { id } = await params;
  if (DASHBOARD.has(id)) redirect(env.NEXT_PUBLIC_BRAND_PORTAL_URL);
  permanentRedirect(`/creator/${id}`);
}
