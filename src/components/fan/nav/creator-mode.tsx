import { Bell, PenSquare, Settings2, Store } from "lucide-react";
import Link from "next/link";
import Button from "~/components/ui/button";

export const CreatorNavigation = {
  Page: { path: "/fans/creator", icon: PenSquare, text: "PAGE" },
  Create: { path: "/fans/creator/posts", icon: PenSquare, text: "POST" },
  Store: { path: "/fans/creator/store", icon: Store, text: "STORE" },

  Settings: {
    path: "/fans/creator/settings",
    icon: Settings2,
    text: "SETTINGS",
  },
  Gift: { path: "/fans/creator/gift", icon: Bell, text: "GIFT" },
  Map: { path: "/maps", icon: Bell, text: "MAP" },
  Pins: { path: "/maps/pins/creator/", icon: Bell, text: "PINS" },
  Bounty: { path: "/fans/creator/bounty", icon: Bell, text: "BOUNTY" },
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
