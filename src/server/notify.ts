import "server-only";

import type { NotificationType, Prisma } from "@prisma/client";

import type { Db } from "~/server/db";

/**
 * One notification event (`actor` did `type` on `entityId`) delivered to each
 * recipient except the actor. A recipient listed in `creatorIds` is notified
 * in their brand inbox, the others in their fan inbox. `meta` carries what the
 * entity can't (an item's name, an amount, a quantity…).
 *
 * Never throws: a notification is never worth failing the action that caused it.
 */
export async function notify(
  db: Db,
  {
    actorId,
    type,
    entityId,
    recipients,
    creatorIds = [],
    meta,
  }: { actorId: string; type: NotificationType; entityId: number; recipients: string[]; creatorIds?: string[]; meta?: Prisma.InputJsonObject },
) {
  const to = [...new Set(recipients)].filter((id) => id && id !== actorId);
  if (!to.length) return;
  try {
    await db.notificationObject.create({
      data: {
        actorId,
        entityType: type,
        entityId,
        isUser: false,
        meta,
        Notification: { create: to.map((notifierId) => ({ notifierId, isCreator: creatorIds.includes(notifierId) })) },
      },
    });
  } catch (e) {
    console.error("[notify] failed", type, entityId, e);
  }
}

/** Notify one brand (in its brand inbox). */
export const notifyBrand = (db: Db, args: { actorId: string; type: NotificationType; entityId: number; creatorId: string; meta?: Prisma.InputJsonObject }) =>
  notify(db, { actorId: args.actorId, type: args.type, entityId: args.entityId, recipients: [args.creatorId], creatorIds: [args.creatorId], meta: args.meta });

/** Notify one fan (in their fan inbox). */
export const notifyFan = (db: Db, args: { actorId: string; type: NotificationType; entityId: number; userId: string; meta?: Prisma.InputJsonObject }) =>
  notify(db, { actorId: args.actorId, type: args.type, entityId: args.entityId, recipients: [args.userId], meta: args.meta });
