import { TRPCError } from "@trpc/server";

/**
 * White-label scoping rules (pure; no DB). Every deployment serves one Platform
 * (PLATFORM_SLUG). The root platform (wadzzo) sees and manages every platform's
 * rows; any other platform only its own.
 */
export type ScopePlatform = { id: string; isRoot: boolean };
export type PlatformCtx = { platform: ScopePlatform };

/**
 * `where` fragment limiting a query to the rows this deployment may see. On the
 * root platform `filter` (the admin panel's platform dropdown) narrows it to one
 * platform; elsewhere it is ignored.
 */
export function platformScope(ctx: PlatformCtx, filter?: string | null): { platformId?: string } {
  if (!ctx.platform.isRoot) return { platformId: ctx.platform.id };
  return filter ? { platformId: filter } : {};
}

/** True when this deployment may see a row stamped with `platformId`. */
export function inPlatformScope(ctx: PlatformCtx, platformId: string | null | undefined) {
  return ctx.platform.isRoot || ctx.platform.id === platformId;
}

/** Throws NOT_FOUND for a row outside this deployment's scope, so its existence isn't revealed. */
export function assertInPlatformScope(ctx: PlatformCtx, platformId: string | null | undefined) {
  if (!inPlatformScope(ctx, platformId)) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
}

/**
 * Whether an admin of `adminPlatformId` may use this deployment's admin panel:
 * its own platform's panel, or any panel when the admin belongs to the root platform.
 */
export function canAdminPlatform(
  admin: { platformId: string; platform: { isRoot: boolean } },
  platform: ScopePlatform,
) {
  return admin.platform.isRoot || admin.platformId === platform.id;
}

/**
 * `platformScope` for an optional relation (e.g. `location.locationGroup`):
 * undefined when unscoped, so rows without the relation stay visible on Wadzzo.
 */
export function relationScope(ctx: PlatformCtx, filter?: string | null) {
  const scope = platformScope(ctx, filter);
  return scope.platformId ? scope : undefined;
}
