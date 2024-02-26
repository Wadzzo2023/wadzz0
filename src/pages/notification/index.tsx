import clsx from "clsx";
import Link from "next/link";
import React from "react";
import {
  NotificationMenu,
  useNotificationMenu,
} from "~/lib/state/fan/notification-menu";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { getNotificationMessage } from "~/utils/notificationConfig";

export default function NotificationPage() {
  const notifications = api.notification.getUserNotification.useInfiniteQuery(
    {
      limit: 10,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  return (
    <div className="p-5">
      <h1 className="text-center text-2xl font-bold">Notifications</h1>
      <div className="flex flex-col items-center p-4">
        <div className="max-w-sm bg-base-300 p-2">
          {notifications.data?.pages?.map((page) => {
            return page.items.map((el) => {
              const { message, url } = getNotificationMessage(el);
              return (
                <div key={el.id} className="flex flex-col hover:bg-base-100">
                  <Link
                    href={url}
                    className="p-4 hover:text-primary hover:underline"
                  >
                    {message} {formatPostCreatedAt(el.createdAt)}
                  </Link>
                </div>
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
