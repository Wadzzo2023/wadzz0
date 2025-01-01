import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { getNotificationMessage } from "~/utils/notificationConfig";

export default function CreatorNotofication() {
  return (
    // <div className="flex flex-col items-center gap-4 p-5 ">
    //   <h2 className="text-2xl font-bold">Notifications</h2>
    //   <div className="bg-base-200 p-4">
    //     {notifications.data?.pages.map((page) => {
    //       return page.items.map((el) => {
    //         const { message, url } = getNotificationMessage(
    //           el.notificationObject,
    //         );
    //         return (
    //           <div key={el.id} className="flex flex-col hover:bg-neutral">
    //             <Link
    //               href={url}
    //               className="p-4 hover:bg-base-100 hover:underline"
    //             >
    //               {message} {formatPostCreatedAt(el.createdAt)}
    //             </Link>
    //           </div>
    //         );
    //       });
    //     })}

    //     {notifications.hasNextPage && (
    //       <button
    //         className="btn"
    //         onClick={() => void notifications.fetchNextPage()}
    //       >
    //         Load More
    //       </button>
    //     )}
    //   </div>
    // </div>
    <div className=" ">
      <div className="flex   flex-row items-start justify-center">
        <Notifications />
      </div>
    </div>
  );
}

interface NotificationObject {
  entityType: NotificationType;
  actor: {
    id: string;
    name: string;
    image: string;
  };
}

const Notifications = () => {
  const [newNotifications, setNewNotifications] = useState([0, 1, 2]);

  function newNotificationCount() {
    return newNotifications.length;
  }

  function isNew(id: number) {
    return newNotifications.includes(id);
  }

  function markAllAsRead() {
    setNewNotifications([]);
  }

  function addNewNotification(id: number) {
    setNewNotifications([...newNotifications, id]);
  }

  function toggleNotification(id: number) {
    if (newNotifications.includes(id)) {
      removeNewNotification(id);
    } else {
      addNewNotification(id);
    }
  }

  function removeNewNotification(id: number) {
    setNewNotifications(
      newNotifications.filter((notification) => notification !== id),
    );
  }
  const notifications =
    api.fan.notification.getCreatorNotifications.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  return (
    <div className=" w-full rounded-lg bg-white shadow-sm lg:w-[715px] ">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">Creator{"'s"} Notifications</h1>
          {/* <a className="my-auto rounded-lg bg-[#0a3279] px-3 font-bold text-white">
            {newNotificationCount()}
          </a> */}
        </div>

        <div className="max-h-[500px] overflow-auto">
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
                default:
                  message = "";
                  url = "";
              }

              return (
                // <div key={el.id} className="flex flex-col hover:bg-neutral">
                //   <Link
                //     href={url}
                //     className="p-4 hover:bg-base-100 hover:underline"
                //   >
                //     {message} {formatPostCreatedAt(el.createdAt)}
                //   </Link>
                // </div>
                <>
                  <div key={el.id} className="flex  gap-x-3  p-2">
                    {enable ? (
                      <Link href={url} className="flex">
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
                        <div className="ml-4 flex w-full flex-col">
                          <a>
                            <span className="message-describe"> {message}</span>
                          </a>
                          <div className="">
                            <p className="message-duration text-gray-500">
                              {formatPostCreatedAt(el.createdAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex">
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
                        <div className="ml-4 flex w-full flex-col">
                          <a>
                            <span className="message-describe"> {message}</span>
                          </a>
                          <div className="">
                            <p className="message-duration text-gray-500">
                              {formatPostCreatedAt(el.createdAt)}
                            </p>
                          </div>
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
};
