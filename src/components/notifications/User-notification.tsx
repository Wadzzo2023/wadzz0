import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

export default function UserNotification() {
  return (
    <div className="">
      <div className="flex  flex-row items-start justify-center">
        <Notifications />
      </div>
    </div>
  );
}
const Notifications = () => {
  const notifications =
    api.fan.notification.getUserNotification.useInfiniteQuery(
      {
        limit: 10,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  return (
    <div className="w-full rounded-lg  bg-white shadow-sm lg:w-[715px]">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">User{"'s"} Notifications</h1>
          {/* <a className="my-auto rounded-lg bg-[#0a3279] px-3 font-bold text-white">
            {newNotificationCount()}
          </a> */}
        </div>

        <div className="max-h-[70vh] min-h-[70vh] overflow-y-auto">
          {notifications.data?.pages.map((page) => {
            return page.notifications.map((el) => {
              let message = "";
              let url = "";

              // Adjust the notification logic here
              switch (el.notificationObject.entityType) {
                case NotificationType.LIKE:
                  message = `${el.notificationObject.actor.name} liked a post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`; // Update URL as per user context
                  break;
                case NotificationType.COMMENT:
                  message = `${el.notificationObject.actor.name} commented on a post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`; // Update URL as per user context
                  break;
                case NotificationType.FOLLOW:
                  message = `${el.notificationObject.actor.name} followed you`;
                  url = `/fans/creator/${el.notificationObject.actor.id}`; // Update URL as per user context
                  break;
                case NotificationType.REPLY:
                  message = `${el.notificationObject.actor.name} replied a comment`;
                  url = `/fans/posts/${el.notificationObject.entityId}`; // Update URL as per user context
                  break;
                case NotificationType.POST:
                  message = `${el.notificationObject.actor.name} created a new post`;
                  url = `/fans/posts/${el.notificationObject.entityId}`; // Update URL as per user context
                  break;

                case NotificationType.BOUNTY:
                  message = `${el.notificationObject.actor.name} added a bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`; // Update URL as per user context
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
                  message = `${el.notificationObject.actor.name} reply to your chat on bounty`;
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
