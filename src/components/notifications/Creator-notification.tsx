import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Users, Award } from "lucide-react";
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
    case NotificationType.BOUNTY_PARTICIPANT:
    case NotificationType.BOUNTY_SUBMISSION:
      return "🏆";
    case NotificationType.BOUNTY_COMMENT:
    case NotificationType.BOUNTY_REPLY:
    case NotificationType.BOUNTY_DOUBT_CREATE:
    case NotificationType.BOUNTY_DOUBT_REPLY:
      return "💭";
    default:
      return "🔔";
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.LIKE:
      return "bg-pink-100";
    case NotificationType.COMMENT:
    case NotificationType.REPLY:
      return "bg-blue-100";
    case NotificationType.FOLLOW:
      return "bg-purple-100";
    case NotificationType.BOUNTY_PARTICIPANT:
    case NotificationType.BOUNTY_SUBMISSION:
      return "bg-amber-100";
    case NotificationType.BOUNTY_COMMENT:
    case NotificationType.BOUNTY_REPLY:
    case NotificationType.BOUNTY_DOUBT_CREATE:
    case NotificationType.BOUNTY_DOUBT_REPLY:
      return "bg-green-100";
    default:
      return "bg-gray-100";
  }
};

const CreatorNotifications = ({ isModernLayout }: { isModernLayout?: boolean }) => {
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
};

function NotificationsLegacy() {
  const notifications =
    api.fan.notification.getCreatorNotifications.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  return (
    <div className="w-full rounded-lg bg-white shadow-sm lg:w-[715px]">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">Creator Notifications</h1>
        </div>

        <div className="max-h-[70vh] min-h-[70vh] overflow-auto">
          {notifications.data?.pages.map((page) => {
            return page.items.map((el) => {
              let message = "";
              let url = "";
              let enable = false;

              switch (el.notificationObject.entityType) {
                case NotificationType.LIKE:
                  message = `${el.notificationObject.actor.name} liked your post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  enable = true;
                  break;
                case NotificationType.COMMENT:
                  message = `${el.notificationObject.actor.name} commented on your post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  enable = true;
                  break;
                case NotificationType.FOLLOW:
                  message = `${el.notificationObject.actor.name} followed you`;
                  url = `/fans/creator/${el.notificationObject.actor.id}`;
                  enable = false;
                  break;
                case NotificationType.REPLY:
                  message = `${el.notificationObject.actor.name} replied to your comment`;
                  url = `/fans/posts/${el.notificationObject.entityId}`;
                  enable = true;
                  break;

                case NotificationType.BOUNTY_PARTICIPANT:
                  message = `${el.notificationObject.actor.name} joined your bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;

                case NotificationType.BOUNTY_SUBMISSION:
                  message = `${el.notificationObject.actor.name} submitted to your bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;

                case NotificationType.BOUNTY_COMMENT:
                  message = `${el.notificationObject.actor.name} commented on your bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;

                case NotificationType.BOUNTY_REPLY:
                  message = `${el.notificationObject.actor.name} replied to your comment on bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;
                case NotificationType.BOUNTY_DOUBT_CREATE:
                  message = `${el.notificationObject.actor.name} created a chat on your bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;
                case NotificationType.BOUNTY_DOUBT_REPLY:
                  message = `${el.notificationObject.actor.name} replied to your chat on bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;

                default:
                  message = "";
                  url = "";
                  enable = false;
              }

              return (
                <>
                  <div key={el.id} className="p-2">
                    {enable ? (
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
                    ) : (
                      <div className="flex items-center justify-start gap-2">
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
                      </div>
                    )}
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
    api.fan.notification.getCreatorNotifications.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchInterval: 30000,
      },
    );

  useEffect(() => {
    if (notifications.data) {
      const newViewedSet = new Set(viewedNotifications);
      notifications.data.pages.forEach((page) => {
        page.items.forEach((notification) => {
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
      page.items.forEach((notification) => {
        if (!viewedNotifications.has(notification.id)) {
          count++;
        }
      });
    });
    return count;
  };

  const allNotifications = notifications.data?.pages.flatMap((page) => page.items) ?? [];

  const groupedNotifications = allNotifications.reduce(
    (groups, notification) => {
      const date = new Date(notification.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    },
    {} as Record<string, typeof allNotifications>,
  );

  const today = new Date().toLocaleDateString();
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

  const formatGroupDate = (dateString: string) => {
    if (dateString === today) return "Today";
    if (dateString === yesterday) return "Yesterday";
    return dateString;
  };

  const filteredEntries = Object.entries(groupedNotifications)
    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
    .map(([date, dateNotifications]) => [
      date,
      dateNotifications.filter((notification) => {
        if (filter === "unread") {
          return !viewedNotifications.has(notification.id);
        }
        return true;
      }),
    ] as const)
    .filter(([, items]) => items.length > 0);

  const hasFilteredResults = filteredEntries.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full rounded-xl bg-card shadow-md lg:w-[715px] overflow-hidden"
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100"
            >
              <Users className="h-5 w-5 text-indigo-600" />
            </motion.div>
            <div className="max-md:hidden">
              <h1 className="text-2xl font-bold">Creator Notifications</h1>
              <p className="text-sm text-gray-500">Updates from your fans and followers</p>
            </div>
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
        ) : !hasFilteredResults && filter === "unread" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Award className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No unread notifications</h3>
            <p className="text-gray-500 mt-2">You&apos;ve read all your notifications</p>
          </motion.div>
        ) : !hasFilteredResults ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Award className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No creator notifications yet</h3>
            <p className="text-gray-500 mt-2">
              When your fans interact with your content, you&apos;ll see notifications here
            </p>
          </motion.div>
        ) : (
          <div className={cn("max-h-[45vh] min-h-[45vh]", "overflow-y-auto rounded-lg border border-gray-100 scrollbar-hide overflow-x-hidden")}>
            <AnimatePresence>
              {filteredEntries.map(([date, dateNotifications]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="sticky top-0 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500 z-10">
                    {formatGroupDate(date)}
                  </div>

                  {dateNotifications.map((notification, index) => {
                    const isNew = !viewedNotifications.has(notification.id);
                    let message = "";
                    let url = "";
                    let enable = false;

                    switch (notification.notificationObject.entityType) {
                      case NotificationType.LIKE:
                        message = `${notification.notificationObject.actor.name} liked your post`;
                        url = `/fans/posts/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.COMMENT:
                        message = `${notification.notificationObject.actor.name} commented on your post`;
                        url = `/fans/posts/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.FOLLOW:
                        message = `${notification.notificationObject.actor.name} followed you`;
                        url = `/fans/creator/${notification.notificationObject.actor.id}`;
                        enable = false;
                        break;
                      case NotificationType.REPLY:
                        message = `${notification.notificationObject.actor.name} replied to your comment`;
                        url = `/fans/posts/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.BOUNTY_PARTICIPANT:
                        message = `${notification.notificationObject.actor.name} joined your bounty`;
                        url = `/bounty/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.BOUNTY_SUBMISSION:
                        message = `${notification.notificationObject.actor.name} submitted to your bounty`;
                        url = `/bounty/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.BOUNTY_COMMENT:
                        message = `${notification.notificationObject.actor.name} commented on your bounty`;
                        url = `/bounty/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.BOUNTY_REPLY:
                        message = `${notification.notificationObject.actor.name} replied to your comment on bounty`;
                        url = `/bounty/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.BOUNTY_DOUBT_CREATE:
                        message = `${notification.notificationObject.actor.name} created a chat on your bounty`;
                        url = `/bounty/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      case NotificationType.BOUNTY_DOUBT_REPLY:
                        message = `${notification.notificationObject.actor.name} replied to your chat on bounty`;
                        url = `/bounty/${notification.notificationObject.entityId}`;
                        enable = true;
                        break;
                      default:
                        message = "";
                        url = "";
                        enable = false;
                    }

                    const icon = getNotificationIcon(notification.notificationObject.entityType);
                    const iconBg = getNotificationColor(notification.notificationObject.entityType);

                    const NotificationContent = () => (
                      <motion.div
                        className={`relative flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${isNew ? "bg-indigo-50/50" : ""}`}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isNew && (
                          <motion.div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"
                            layoutId={`newIndicator-${notification.id}`}
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
                          <div
                            className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full ${iconBg} text-xs`}
                          >
                            {icon}
                          </div>
                        </div>

                        <div className="flex w-full flex-col items-start">
                          <span className="font-medium text-gray-900">{message}</span>
                          <p className="text-sm text-gray-500">{formatPostCreatedAt(notification.createdAt)}</p>
                        </div>

                        {notification.notificationObject.entityType === NotificationType.BOUNTY_SUBMISSION && (
                          <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200">
                            Review
                          </Badge>
                        )}
                      </motion.div>
                    );

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        {enable ? (
                          <Link href={url}>
                            <NotificationContent />
                          </Link>
                        ) : (
                          <NotificationContent />
                        )}
                        {index < dateNotifications.length - 1 && <Separator />}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
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

export default CreatorNotifications;
