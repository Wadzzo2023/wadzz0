import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Badge } from "~/components/shadcn/ui/badge";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { Glass } from "~/components/glass/glass";
import { cn } from "~/lib/utils";



const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.LIKE:
      return "❤️";
    case NotificationType.COMMENT:
    case NotificationType.REPLY:
      return "💬";
    case NotificationType.FOLLOW:
      return "👤";
    case NotificationType.POST:
      return "📝";
    case NotificationType.BOUNTY:
    case NotificationType.BOUNTY_WINNER:
      return "🏆";
    case NotificationType.BOUNTY_COMMENT:
    case NotificationType.BOUNTY_REPLY:
    case NotificationType.BOUNTY_DOUBT_REPLY:
      return "💭";
    default:
      return "🔔";
  }
};

export default function UserNotification({ isModernLayout }: { isModernLayout?: boolean }) {
  if (isModernLayout) {
    return (
      <div className="container mx-auto px-0 md:px-4 py-6">
        <div className="flex flex-row items-start justify-center">
          <Notifications isModernLayout={isModernLayout} />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-row items-start justify-center">
        <NotificationsLegacy />
      </div>
    </div>
  );
}

function NotificationsLegacy() {
  const notifications =
    api.fan.notification.getUserNotification.useInfiniteQuery(
      {
        limit: 10,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const allNotifications = notifications.data?.pages.flatMap((page) => page.notifications) ?? [];
  const hasNotifications = allNotifications.length > 0;

  if (notifications.isLoading) {
    return (
      <div className="w-full rounded-lg bg-white shadow-sm lg:w-[715px]">
        <div className="p-6">
          <div className="mb-6 flex flex-row gap-x-6">
            <h1 className="text-2xl font-bold">User Notifications</h1>
          </div>
          <div className="flex h-[70vh] items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasNotifications) {
    return (
      <div className="w-full rounded-lg bg-white shadow-sm lg:w-[715px]">
        <div className="p-6">
          <div className="mb-6 flex flex-row gap-x-6">
            <h1 className="text-2xl font-bold">User Notifications</h1>
          </div>
          <div className="flex h-[70vh] flex-col items-center justify-center text-center">
            <div className="rounded-full bg-zinc-100 p-4 mb-4">
              <Bell className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="text-lg font-semibold text-zinc-900">No notifications yet</p>
            <p className="text-sm text-zinc-500 mt-1">You&apos;re all caught up!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-white shadow-sm lg:w-[715px]">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">User Notifications</h1>
        </div>

        <div className="max-h-[70vh] min-h-[70vh] overflow-y-auto">
          {notifications.data?.pages.map((page) => {
            return page.notifications.map((el) => {
              let message = "";
              let url = "";

              switch (el.notificationObject.entityType) {
                case NotificationType.LIKE:
                  message = `${el.notificationObject.actor.name} liked a post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  break;
                case NotificationType.COMMENT:
                  message = `${el.notificationObject.actor.name} commented on a post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  break;
                case NotificationType.FOLLOW:
                  message = `${el.notificationObject.actor.name} followed you`;
                  url = `/fans/creator/${el.notificationObject.actor.id}`;
                  break;
                case NotificationType.REPLY:
                  message = `${el.notificationObject.actor.name} replied a comment`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  break;
                case NotificationType.POST:
                  message = `${el.notificationObject.actor.name} created a new post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  break;

                case NotificationType.BOUNTY:
                  message = `${el.notificationObject.actor.name} added a bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  break;
                case NotificationType.BOUNTY_WINNER:
                  message = "You won a bounty";
                  url = `/bounty/${el.notificationObject.entityId}`;
                  break;
                case NotificationType.BOUNTY_COMMENT:
                  message = `${el.notificationObject.actor.name} commented on a bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  break;

                case NotificationType.BOUNTY_REPLY:
                  message = `${el.notificationObject.actor.name} replied to a comment on bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  break;

                case NotificationType.BOUNTY_DOUBT_REPLY:
                  message = `${el.notificationObject.actor.name} replied to your chat on bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  break;
                default:
                  message = "";
                  url = "";
              }

              return (
                <>
                  <div key={el.id} className="p-2">
                    <Link
                      href={url}
                      className="flex items-center justify-start gap-2"
                    >
                      <Image
                        width={1000}
                        height={1000}
                        className="h-10 w-10"
                        src={
                          el.notificationObject.actor.image
                            ? el.notificationObject.actor.image
                            : "/images/icons/avatar-icon.png"
                        }
                        alt=""
                      />
                      <div className="flex w-full flex-col items-start">
                        <span className="text-start"> {message}</span>

                        <p className="text-start text-gray-500">
                          {formatPostCreatedAt(el.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </div>
                  <Separator />
                </>
              );
            });
          })}

          {notifications.hasNextPage && (
            <button
              className="btn"
              onClick={() => void notifications.fetchNextPage()}
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const Notifications = ({ isModernLayout }: { isModernLayout?: boolean }) => {
  const [viewedNotifications, setViewedNotifications] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  const notifications =
    api.fan.notification.getUserNotification.useInfiniteQuery(
      {
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchInterval: 30000,
      },
    );

  useEffect(() => {
    if (notifications.data) {
      const newViewedSet = new Set(viewedNotifications);
      notifications.data.pages.forEach((page) => {
        page.notifications.forEach((notification) => {
          newViewedSet.add(notification.id);
        });
      });
      setViewedNotifications(newViewedSet);
    }
  }, [notifications.data]);

  const newNotificationCount = () => {
    if (!notifications.data) return 0;

    let count = 0;
    notifications.data.pages.forEach((page) => {
      page.notifications.forEach((notification) => {
        if (!viewedNotifications.has(notification.id)) {
          count++;
        }
      });
    });
    return count;
  };

  const allNotifications = notifications.data?.pages.flatMap((page) => page.notifications) ?? [];

  const filtered = allNotifications.filter((notification) => {
    if (filter === "unread") {
      return !viewedNotifications.has(notification.id);
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full rounded-xl shadow-md lg:w-[715px] overflow-y-auto bg-card"
    >
      <div className="p-6">
        <motion.div
          className="mb-6 flex flex-row items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Bell className="h-6 w-6 text-indigo-500" />
            </motion.div>
            <h1 className="text-2xl font-bold max-md:hidden">Notifications</h1>
            {newNotificationCount() > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Badge variant="destructive" className="ml-2">
                  {newNotificationCount()} new
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="relative w-fit overflow-hidden rounded-[0.7rem] border border-black/15 p-[0.2rem] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <Glass
              className={{
                root: "pointer-events-none absolute inset-0 z-0 rounded-[0.7rem] *:rounded-[0.7rem]",
                tint: "bg-[#f3f1ea]/65",
                effect: "backdrop-blur-[8px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,251,242,0.24),rgba(248,243,232,0.08)_55%,rgba(245,240,230,0.03)_100%)]",
                shine: "shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.85),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]",
              }}
            />
            <div className="relative z-10 inline-flex items-center gap-0.5">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "relative inline-flex items-center justify-center rounded-[0.5rem] border px-2.5 py-1 text-xs font-normal transition-all duration-200",
                  "focus-visible:outline-none",
                  filter === "all"
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "relative inline-flex items-center justify-center rounded-[0.5rem] border px-2.5 py-1 text-xs font-normal transition-all duration-200",
                  "focus-visible:outline-none",
                  filter === "unread"
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                )}
              >
                Unread
              </button>
            </div>
          </div>
        </motion.div>

        {notifications.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && filter === "unread" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No unread notifications</h3>
            <p className="text-gray-500 mt-2">You&apos;ve read all your notifications</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No notifications yet</h3>
            <p className="text-gray-500 mt-2">When you get notifications, they&apos;ll show up here</p>
          </motion.div>
        ) : (
          <div className={cn("max-h-[45vh] min-h-[45vh]", "overflow-y-auto rounded-lg border border-gray-100 scrollbar-hide overflow-x-hidden")}>
            <AnimatePresence>
              {filtered.map((notification, index) => {
                const isNew = !viewedNotifications.has(notification.id);
                let message = "";
                let url = "";

                switch (notification.notificationObject.entityType) {
                  case NotificationType.LIKE:
                    message = `${notification.notificationObject.actor.name} liked a post`;
                    url = `/fans/posts/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.COMMENT:
                    message = `${notification.notificationObject.actor.name} commented on a post`;
                    url = `/fans/posts/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.FOLLOW:
                    message = `${notification.notificationObject.actor.name} followed you`;
                    url = `/fans/creator/${notification.notificationObject.actor.id}`;
                    break;
                  case NotificationType.REPLY:
                    message = `${notification.notificationObject.actor.name} replied a comment`;
                    url = `/fans/posts/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.POST:
                    message = `${notification.notificationObject.actor.name} created a new post`;
                    url = `/fans/posts/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.BOUNTY:
                    message = `${notification.notificationObject.actor.name} added a bounty`;
                    url = `/bounty/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.BOUNTY_WINNER:
                    message = "You won a bounty";
                    url = `/bounty/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.BOUNTY_COMMENT:
                    message = `${notification.notificationObject.actor.name} commented on a bounty`;
                    url = `/bounty/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.BOUNTY_REPLY:
                    message = `${notification.notificationObject.actor.name} replied to a comment on bounty`;
                    url = `/bounty/${notification.notificationObject.entityId}`;
                    break;
                  case NotificationType.BOUNTY_DOUBT_REPLY:
                    message = `${notification.notificationObject.actor.name} replied to your chat on bounty`;
                    url = `/bounty/${notification.notificationObject.entityId}`;
                    break;
                  default:
                    message = "";
                    url = "";
                }

                const icon = getNotificationIcon(notification.notificationObject.entityType);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Link href={url}>
                      <motion.div
                        className={`relative flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${isNew ? "bg-indigo-50/50" : ""}`}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isNew && (
                          <motion.div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"
                            layoutId="newIndicator"
                          />
                        )}

                        <div className="relative">
                          <Image
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            src={
                              notification.notificationObject.actor.image ??
                              "/images/icons/avatar-icon.png"
                            }
                            alt={notification.notificationObject.actor.name ?? "User"}
                          />
                          <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs">
                            {icon}
                          </div>
                        </div>

                        <div className="flex w-full flex-col items-start">
                          <span className="font-medium text-gray-900">{message}</span>
                          <p className="text-sm text-gray-500">{formatPostCreatedAt(notification.createdAt)}</p>
                        </div>
                      </motion.div>
                    </Link>
                    {index < filtered.length - 1 && <Separator />}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {notifications.hasNextPage && (
              <motion.div
                className="flex justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="outline"
                  onClick={() => void notifications.fetchNextPage()}
                  disabled={notifications.isFetchingNextPage}
                  className="w-full"
                >
                  {notifications.isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Load More
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
