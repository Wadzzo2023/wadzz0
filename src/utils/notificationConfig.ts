import { NotificationObject, NotificationType } from "@prisma/client";
import { truncateString } from "./string";

export const NotificationEntity = {
  Post: 1,
  Like: 2,
  Comment: 3,
  Subscribe: 4,
} as const;

export function getNotificationMessage(
  notificationObject: NotificationObject,
): { message: string; url: string } {
  const actoId = truncateString(notificationObject.actorId);

  switch (notificationObject.entityType) {
    case NotificationType.POST:
      return {
        message: `${actoId}  created post `,
        url: `/fans/posts/${notificationObject.entityId}`,
      };
    case NotificationType.LIKE:
      return {
        message: `${actoId} liked your post ${notificationObject.entityId}`,
        url: `/fans/posts/${notificationObject.entityId}`,
      };
    case NotificationType.COMMENT:
      return {
        message: `${actoId} commented on your post ${notificationObject.entityId}`,
        url: `/fans/posts/${notificationObject.entityId}`,
      };
    case NotificationType.SUBSCRIPTION:
      return {
        message: `${actoId} subscribed to you`,
        url: `/fans/creator/${notificationObject.entityId}`,
      };
    default:
      return {
        message: "",
        url: "",
      };
  }
}

// post created
// you have ended subscription.

// commented on post.
// liked your post.
// subscribed
