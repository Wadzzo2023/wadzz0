import { Bell, PenSquare, Settings2, Store } from "lucide-react";
import Link from "next/link";
import Button from "~/components/ui/button";
import { creatorExtraFiledsSchema } from "~/types/creator";
import { api } from "~/utils/api";

export const CreatorNavigation = {
  Page: {
    path: "/fans/creator",
    icon: PenSquare,
    text: "PAGE",
    needAproval: true,
  },
  Create: {
    path: "/fans/creator/posts",
    icon: PenSquare,
    text: "POST",
    needAproval: true,
  },
  Store: {
    path: "/fans/creator/store",
    icon: Store,
    text: "STORE",
    needAproval: true,
  },

  Settings: {
    path: "/fans/creator/settings",
    icon: Settings2,
    text: "SETTINGS",
    needAproval: false,
  },
  Gift: {
    path: "/fans/creator/gift",
    icon: Bell,
    text: "GIFT",
    needAproval: true,
  },
  Map: { path: "/maps", icon: Bell, text: "MAP", needAproval: false },
  Pins: {
    path: "/maps/pins/creator/",
    icon: Bell,
    text: "PINS",
    needAproval: true,
  },
  Bounty: {
    path: "/fans/creator/bounty",
    icon: Bell,
    text: "BOUNTY",
    needAproval: true,
  },
} as const;

export function CreatorNavButtons() {
  const creator = api.fan.creator.meCreator.useQuery();
  return (
    <div className="flex h-full w-full flex-col items-start gap-2 ">
      {Object.entries(CreatorNavigation).map(
        ([key, { path, icon: Icon, text }]) => {
          const extraFields = creatorExtraFiledsSchema.parse(
            creator.data?.extraFields,
          );
          const navConfig =
            CreatorNavigation[key as keyof typeof CreatorNavigation];
          if (navConfig.needAproval && !extraFields?.navPermission) {
            return null;
          }
          return (
            <Link href={path} className="w-full" key={key}>
              <Button
                path={path}
                icon={<Icon className="h-5 w-5" />}
                text={text}
              />
            </Link>
          );
        },
      )}
      {/* <Profile /> */}
    </div>
  );
}
