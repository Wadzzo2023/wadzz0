import clsx from "clsx";
import { useState } from "react";
import { getCookie } from "cookies-next";
import CreatorNotifications from "~/components/notifications/Creator-notification";
import UserNotification from "~/components/notifications/User-notification";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";

type NotificationTab = "user" | "creator";

const Notification = () => {
  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "legacy" || cookieMode === "modern") {
      return cookieMode;
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "legacy" || storedMode === "modern") {
        return storedMode;
      }
    }
    return "modern";
  });

  const [selectedTab, setSelectedTab] = useState<NotificationTab>("user");

  if (layoutMode === "modern") {
    return (
      <div>
        <div className="my-5 flex w-full justify-center">
          <div className="relative w-fit overflow-hidden rounded-[0.9rem] border border-black/15 bg-[#f3f1ea]/80 p-[0.3rem] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <div className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setSelectedTab("user")}
                className={clsx(
                  "relative inline-flex items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  selectedTab === "user"
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black"
                )}
              >
                User Notifications
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("creator")}
                className={clsx(
                  "relative inline-flex items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  selectedTab === "creator"
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black"
                )}
              >
                Creator Notifications
              </button>
            </div>
          </div>
        </div>
        {selectedTab === "user" ? <UserNotification /> : <CreatorNotifications />}
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="user" className="w-full p-4 text-center">
        <TabsList className="">
          <TabsTrigger value="user">User Notifications</TabsTrigger>
          <TabsTrigger value="creator">Creator Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="user">
          <UserNotification />
        </TabsContent>
        <TabsContent value="creator">
          <CreatorNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Notification;
