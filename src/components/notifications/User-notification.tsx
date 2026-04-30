import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { getCookie } from "cookies-next";
import { Bell } from "lucide-react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

export default function UserNotification() {
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

  if (layoutMode === "modern") {
    return (
      <div className="flex w-full flex-col items-center">
        <Notifications layoutMode={layoutMode} />
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex  flex-row items-start justify-center">
        <Notifications layoutMode={layoutMode} />
      </div>
    </div>
  );
}
const Notifications = ({ layoutMode = "modern" }: { layoutMode?: "modern" | "legacy" }) => {
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
                      <div className=" flex w-full flex-col items-start">
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
};
