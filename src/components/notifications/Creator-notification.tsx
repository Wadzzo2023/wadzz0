import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

const CreatorNotifications = () => {
  return (
    <div className="">
      <div className="flex  flex-row items-start justify-center">
        <Notifications />
      </div>
    </div>
  );
};
const Notifications = () => {
  const notifications =
    api.fan.notification.getCreatorNotifications.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  console.log("creator", notifications);
  return (
    <div className=" w-full rounded-lg bg-white shadow-sm lg:w-[715px] ">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">Creator{"'s"} Notifications</h1>
          {/* <a className="my-auto rounded-lg bg-[#0a3279] px-3 font-bold text-white">
            {newNotificationCount()}
          </a> */}
        </div>

        <div className="max-h-[70vh] min-h-[70vh] overflow-auto">
          {/* Mark Webber */}
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
                case NotificationType.BOUNTY_DOUBT:
                  message = `${el.notificationObject.actor.name} added a doubt on your bounty`;
                  url = `/bounty/${el.notificationObject.entityId}`;
                  enable = true;
                  break;
                default:
                  message = "";
                  url = "";
              }

              return (
                <>
                  <div key={el.id} className=" p-2">
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
                        <div className=" flex w-full flex-col items-start ">
                          <span className="text-start"> {message}</span>

                          <p className="text-start text-gray-500">
                            {formatPostCreatedAt(el.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="">
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

                          <p className=" text-start text-gray-500">
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
              className="btn "
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

export default CreatorNotifications;
