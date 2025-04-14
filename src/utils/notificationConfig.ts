import { NotificationObject, NotificationType } from "@prisma/client";
import { truncateString } from "./string";


export function getNotificationMessage(
  notificationObject: NotificationObject,
): { message: string; url: string } {
  const actoId = truncateString(notificationObject.actorId);

  switch (notificationObject.entityType) {

    case NotificationType.LIKE:
      return {
        message: `${actoId} liked your post`,
        url: `/fans/posts/${notificationObject.entityId}`,
      };
    case NotificationType.COMMENT:
      return {
        message: `${actoId} commented on your post ${notificationObject.entityId}`,
        url: `/fans/posts/${notificationObject.entityId}`,
      };
    case NotificationType.FOLLOW:
      return {
        message: `${actoId} follow to you`,
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
