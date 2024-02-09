import { NotificationObject } from "@prisma/client";

export const NotificationEntity = {
  Post: 1,
  Like: 2,
  Comment: 3,
  Subscribe: 4,
} as const;

export function getNotificationMessage(notificationObject: NotificationObject) {
  switch (notificationObject.entiryId) {
    case NotificationEntity.Post:
      return `${notificationObject.actorId} post created`;
    case NotificationEntity.Like:
      return "liked your post";
    case NotificationEntity.Comment:
      return "commented on post";
    case NotificationEntity.Subscribe:
      return "subscribed";
  }
}

// post created
// you have ended subscription.

// commented on post.
// liked your post.
// subscribed
