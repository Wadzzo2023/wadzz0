import type { MetadataRoute } from "next";

import { env } from "~/env";
import { db } from "~/server/db";
import { getCurrentPlatform } from "~/server/platform";
import { platformScope } from "~/server/platform-scope";

// Rebuilt at most hourly.
export const revalidate = 3600;

/** Public pages plus every listed item, approved brand, public post and open bounty on this platform. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_URL.replace(/\/$/, "");
  const scope = platformScope({ platform: await getCurrentPlatform() });

  const [items, creators, posts, bounties] = await Promise.all([
    db.asset.findMany({ where: { ...scope, marketItems: { some: { placerId: { not: null } } }, creator: { approved: true } }, select: { id: true, updatedAt: true }, take: 5000 }),
    db.creator.findMany({ where: { ...scope, approved: true }, select: { id: true, vanityURL: true }, take: 5000 }),
    // members-only posts are left out: their bodies aren't public
    db.post.findMany({ where: { ...scope, subscriptionId: null, creator: { approved: true } }, select: { id: true, updatedAt: true }, orderBy: { id: "desc" }, take: 5000 }),
    db.bounty.findMany({ where: { ...scope, status: "APPROVED" }, select: { id: true, createdAt: true }, orderBy: { id: "desc" }, take: 5000 }),
  ]);

  const pages: MetadataRoute.Sitemap = ["", "/marketplace", "/creators", "/bounties", "/feed", "/about", "/faq", "/support", "/privacy"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p === "" || p === "/marketplace" || p === "/feed" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  return [
    ...pages,
    ...items.map((i) => ({ url: `${base}/item/${i.id}`, lastModified: i.updatedAt, priority: 0.6 })),
    ...creators.map((c) => ({ url: `${base}/creator/${c.vanityURL ?? c.id}`, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${base}/posts/${p.id}`, lastModified: p.updatedAt, priority: 0.4 })),
    ...bounties.map((b) => ({ url: `${base}/bounties/${b.id}`, lastModified: b.createdAt, priority: 0.5 })),
  ];
}
