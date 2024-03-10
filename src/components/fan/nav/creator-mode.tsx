import { Bell, PenSquare, Settings2, Store } from "lucide-react";
import Link from "next/link";
import Button from "~/components/ui/button";

export const CreatorNavigation = {
  Page: { path: "/fans/creator", icon: PenSquare, text: "PAGE" },
  Create: { path: "/fans/creator/posts", icon: PenSquare, text: "CREATE" },
  Store: { path: "/fans/creator/store", icon: Store, text: "STORE" },
  Notification: {
    path: "fans/creator/notification",
    icon: Bell,
    text: "Notification",
  },
  Settings: { path: "/creator/settings", icon: Settings2, text: "Settings" },
} as const;

export function CreatorNavButtons() {
  return (
    <div className="flex h-full w-full flex-col items-start gap-2 ">
      {Object.entries(CreatorNavigation).map(
        ([key, { path, icon: Icon, text }]) => (
          <Link href={path} className="w-full" key={key}>
            <Button
              path={path}
              icon={<Icon className="h-5 w-5" />}
              text={text}
            />
          </Link>
        ),
      )}
      {/* <Profile /> */}
    </div>
  );
}
