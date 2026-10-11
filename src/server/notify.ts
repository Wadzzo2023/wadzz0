import "server-only";

import type { NotificationType } from "@prisma/client";

import type { Db } from "~/server/db";

/**
 * One notification event (actor did `type` on `entityId`) delivered to each
 * recipient except the actor. `creatorIds` marks recipients notified in their
 * brand inbox rather than their fan inbox.
 */
export async function notify(
  db: Db,
  { actorId, type, entityId, recipients, creatorIds = [] }: { actorId: string; type: NotificationType; entityId: number; recipients: string[]; creatorIds?: string[] },
) {
  const to = [...new Set(recipients)].filter((id) => id && id !== actorId);
  if (!to.length) return;
  await db.notificationObject.create({
    data: {
      actorId,
      entityType: type,
      entityId,
      isUser: false,
      Notification: { create: to.map((notifierId) => ({ notifierId, isCreator: creatorIds.includes(notifierId) })) },
    },
  });
}
