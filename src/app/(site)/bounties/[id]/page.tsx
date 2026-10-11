import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { BountyView } from "~/components/bounty/bounty-view";
import { serverApi } from "~/server/api/server";

const getBounty = cache(async (id: number) => {
  try {
    return await (await serverApi()).bounty.byId({ id });
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") return null;
    throw e;
  }
});

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getBounty(id) : null;
}

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: PageProps<"/bounties/[id]">): Promise<Metadata> {
  const b = await load(params);
  if (!b) return { title: "Bounty not found", robots: { index: false } };
  const description = plain(b.description).slice(0, 180) || `A bounty by ${b.brand.name} on Wadzzo.`;
  return {
    title: `${b.title} · ${b.brand.name}`,
    description,
    alternates: { canonical: `/bounties/${b.id}` },
    openGraph: { title: b.title, description, images: b.imageUrl ? [b.imageUrl] : undefined },
  };
}

export default async function BountyPage({ params }: PageProps<"/bounties/[id]">) {
  const b = await load(params);
  if (!b) notFound();
  return (
    <Suspense>
      <BountyView initial={b} />
    </Suspense>
  );
}
