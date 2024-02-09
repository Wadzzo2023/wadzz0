import clsx from "clsx";
import React from "react";
import {
  NotificationMenu,
  useNotificationMenu,
} from "~/lib/state/notification-menu";
import { api } from "~/utils/api";

export default function NotificationPage() {
  return (
    <div className="m-5">
      <h1 className="text-3xl font-bold">Notification</h1>
      <NotificationTabs />
      <RenderTabs />
    </div>
  );
}

function RenderTabs() {
  const { selectedMenu, setSelectedMenu } = useNotificationMenu();
  switch (selectedMenu) {
    case NotificationMenu.User:
      return <YourNotifications />;
    case NotificationMenu.Creator:
      return <CreatorNotifications />;
  }
}
function YourNotifications() {
  // const notifications = api.notification.getYourNotifications.useQuery();

  return (
    <div>
      {/* {notifications.data?.map((el) => (
        <p>{el.notificationObject.entityType}</p>
      ))} */}
      <p>your notifications</p>
    </div>
  );
}

function CreatorNotifications() {
  const notifications = api.notification.getCreatorNotifications.useQuery();

  return (
    <div>
      {notifications.data?.map((el) => (
        <p key={el.id}>{el.notificationObject.entityType}</p>
      ))}
    </div>
  );
}

function NotificationTabs() {
  const { selectedMenu, setSelectedMenu } = useNotificationMenu();
  return (
    <div role="tablist" className="tabs tabs-bordered mt-10">
      {Object.values(NotificationMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx("tab", selectedMenu == key && "tab-active")}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}
