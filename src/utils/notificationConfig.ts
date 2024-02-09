import { NotificationObject, NotificationType } from "@prisma/client";

export const NotificationEntity = {
  Post: 1,
  Like: 2,
  Comment: 3,
  Subscribe: 4,
} as const;

export function getNotificationMessage(notificationObject: NotificationObject) {
  switch (notificationObject.entityType) {
    case NotificationType.POST:
      return `${notificationObject.actorId} post created`;
    case NotificationType.LIKE:
      return "liked your post";
    case NotificationType.COMMENT:
      return "commented on post";
    case NotificationType.SUBSCRIPTION:
      return "subscribed";
  }
}

// post created
// you have ended subscription.

// commented on post.
// liked your post.
// subscribed
