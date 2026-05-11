import { useState } from "react";
import { getCookie } from "cookies-next";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users } from "lucide-react";
import { cn } from "~/lib/utils";
import { Glass } from "~/components/glass/glass";
import CreatorNotifications from "~/components/notifications/Creator-notification";
import UserNotification from "~/components/notifications/User-notification";

import {
  Tabs,
  TabsContent,
} from "~/components/shadcn/ui/tabs";

const TABS = [
  { value: "user", label: "User Notifications", icon: Bell },
  { value: "creator", label: "Creator Notifications", icon: Users },
];

type NotificationTab = "user" | "creator";

const Notification = () => {
  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "modern") {
      return "modern";
    }
    if (cookieMode === "legacy") {
      return "legacy";
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "modern") {
        return "modern";
      }
      if (storedMode === "legacy") {
        return "legacy";
      }
    }
    return "legacy";
  });

  const [selectedTab, setSelectedTab] = useState<NotificationTab>("user");
  const isModernLayout = layoutMode === "modern";

  if (isModernLayout) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("container mx-auto py-8", "max-w-[85vw] pb-28")}
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-2 text-muted-foreground">Stay updated with all your activities</p>
        </motion.div>

        <Tabs defaultValue="user" className="w-full">
          <div className="mb-6 flex justify-center">
            <div className="relative mx-auto w-fit overflow-hidden rounded-[0.9rem] border border-black/15 p-[0.3rem] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
              <Glass
                className={{
                  root: "pointer-events-none absolute inset-0 z-0 rounded-[0.9rem] *:rounded-[0.9rem]",
                  tint: "bg-[#f3f1ea]/65",
                  effect:
                    "backdrop-blur-[8px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,251,242,0.24),rgba(248,243,232,0.08)_55%,rgba(245,240,230,0.03)_100%)]",
                  shine:
                    "shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.85),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]",
                }}
              />
              <div className="relative z-10 inline-flex items-center gap-0.5">
                {TABS.map((tab) => {
                  const isActive = selectedTab === tab.value;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedTab(tab.value as NotificationTab)}
                      className={cn(
                        "relative inline-flex items-center justify-center gap-1.5 rounded-[0.7rem] border px-3 py-2 text-sm font-normal transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        isActive
                          ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                          : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="user" className="mt-0">
                <UserNotification isModernLayout={isModernLayout} />
              </TabsContent>
              <TabsContent value="creator" className="mt-0">
                <CreatorNotifications isModernLayout={isModernLayout} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="user" className="w-full p-4 text-center">
        <div className="grid w-full max-w-md grid-cols-2 h-14 p-1 rounded-xl bg-primary shadow-sm shadow-foreground mx-auto">
          {TABS.map((tab) => {
            const isActive = selectedTab === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedTab(tab.value as NotificationTab)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg h-12 transition-all duration-200",
                  isActive && "shadow-sm shadow-foreground bg-background",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <TabsContent value="user">
          <UserNotification isModernLayout={isModernLayout} />
        </TabsContent>
        <TabsContent value="creator">
          <CreatorNotifications isModernLayout={isModernLayout} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Notification;
