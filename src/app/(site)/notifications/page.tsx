import type { Metadata } from "next";

import { NotificationsPage } from "~/components/notification/notifications-view";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default function Page() {
  return <NotificationsPage />;
}
