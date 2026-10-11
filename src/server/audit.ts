import type { Platform, Prisma } from "@prisma/client";

import type { Db } from "~/server/db";

type AuditCtx = {
  db: Db;
  platform: Platform;
  session?: { user?: { id: string } } | null;
};

export type AuditEntry = {
  /** dotted verb, e.g. "brand.approve", "pin.hide", "admin.add", "user.signup" */
  action: string;
  entityType: string;
  entityId: string | number;
  /** platform of the affected row; recorded when it differs from the request's platform */
  targetPlatformId?: string | null;
  meta?: Prisma.InputJsonValue;
  /** defaults to the session user */
  actorId?: string | null;
};

/**
 * Append to the AuditLog: who did what, from which platform. Best effort: a
 * failed write is logged and never fails the action it describes.
 */
export async function logAudit(ctx: AuditCtx, entry: AuditEntry) {
  try {
    await ctx.db.auditLog.create({
      data: {
        platformId: ctx.platform.id,
        actorId: entry.actorId ?? ctx.session?.user?.id ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: String(entry.entityId),
        targetPlatformId:
          entry.targetPlatformId && entry.targetPlatformId !== ctx.platform.id
            ? entry.targetPlatformId
            : null,
        meta: entry.meta,
      },
    });
  } catch (error) {
    console.error("[audit] failed to log", entry.action, error);
  }
}
