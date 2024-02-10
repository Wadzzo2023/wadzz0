import Link from "next/link";
import React from "react";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { getNotificationMessage } from "~/utils/notificationConfig";

export default function CreatorNotofication() {
  const notifications = api.notification.getCreatorNotifications.useQuery();
  return (
    <div className="flex flex-col items-center gap-4 p-5 ">
      <h2 className="text-3xl font-bold">Notifications</h2>
      <div className="bg-base-200 p-4">
        {notifications.data?.map((el) => {
          const { message, url } = getNotificationMessage(
            el.notificationObject,
          );
          return (
            <div key={el.id} className="flex flex-col hover:bg-neutral">
              <Link
                href={url}
                className="p-4 hover:text-primary hover:underline"
              >
                {message} {formatPostCreatedAt(el.createdAt)}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
