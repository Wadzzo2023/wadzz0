// import clsx from "clsx";
// import Link from "next/link";
// import React from "react";
// import {
//   NotificationMenu,
//   useNotificationMenu,
// } from "~/lib/state/fan/notification-menu";
// import { api } from "~/utils/api";
// import { formatPostCreatedAt } from "~/utils/format-date";
// import { getNotificationMessage } from "~/utils/notificationConfig";

// export default function NotificationPage() {
//   const notifications =
//     api.fan.notification.getUserNotification.useInfiniteQuery(
//       {
//         limit: 10,
//       },
//       { getNextPageParam: (lastPage) => lastPage.nextCursor },
//     );

//   return (
//     <div className="p-5">
//       <h1 className="text-center text-2xl font-bold">Notifications</h1>
//       <div className="flex flex-col items-center p-4">
//         <div className="max-w-sm bg-base-300 p-2">
//           {notifications.data?.pages?.map((page) => {
//             return page.items.map((el) => {
//               const { message, url } = getNotificationMessage(el);
//               return (
//                 <div key={el.id} className="flex flex-col hover:bg-base-100">
//                   <Link
//                     href={url}
//                     className="p-4 hover:text-primary hover:underline"
//                   >
//                     {message} {formatPostCreatedAt(el.createdAt)}
//                   </Link>
//                 </div>
//               );
//             });
//           })}
//           {notifications.hasNextPage && (
//             <button
//               className="btn"
//               onClick={() => void notifications.fetchNextPage()}
//             >
//               Load More
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function RenderTabs() {
//   const { selectedMenu, setSelectedMenu } = useNotificationMenu();
//   switch (selectedMenu) {
//     case NotificationMenu.User:
//       return <YourNotifications />;
//     case NotificationMenu.Creator:
//       return <CreatorNotifications />;
//   }
// }
// function YourNotifications() {
//   // const notifications = api.notification.getYourNotifications.useQuery();

//   return (
//     <div>
//       {/* {notifications.data?.map((el) => (
//         <p>{el.notificationObject.entityType}</p>
//       ))} */}
//       <p>your notifications</p>
//     </div>
//   );
// }

// function CreatorNotifications() {
//   const notifications = api.notification.getCreatorNotifications.useQuery();

//   return (
//     <div>
//       {notifications.data?.map((el) => (
//         <p key={el.id}>{el.notificationObject.entityType}</p>
//       ))}
//     </div>
//   );
// }

// function NotificationTabs() {
//   const { selectedMenu, setSelectedMenu } = useNotificationMenu();
//   return (
//     <div role="tablist" className="tabs tabs-boxed mt-10">
//       {Object.values(NotificationMenu).map((key) => {
//         return (
//           <a
//             key={key}
//             onClick={() => setSelectedMenu(key)}
//             role="tab"
//             className={clsx("tab", selectedMenu == key && "tab-active")}
//           >
//             {key}
//           </a>
//         );
//       })}
//     </div>
//   );
// }

import { NotificationType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { getNotificationMessage } from "~/utils/notificationConfig";

export default function UserNotification() {
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
  // console.log(notifications);
  return (
    <div className="w-full rounded-lg bg-white shadow-sm lg:w-[715px]">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">User{"'s"} Notifications</h1>
          {/* <a className="my-auto rounded-lg bg-[#0a3279] px-3 font-bold text-white">
            {newNotificationCount()}
          </a> */}
        </div>

        <div className="max-h-[500px] overflow-auto">
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
                default:
                  message = "";
                  url = "";
              }

              return (
                <>
                  <div key={el.id} className="flex gap-x-3 p-2">
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
