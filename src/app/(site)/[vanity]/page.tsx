import { notFound, permanentRedirect } from "next/navigation";

import { db } from "~/server/db";

/** Vanity URLs (wadzzo.com/brandname) open the brand's page. */
export default async function VanityPage({ params }: PageProps<"/[vanity]">) {
  const key = decodeURIComponent((await params).vanity);
  const creator = await db.creator.findFirst({
    where: { vanityURL: { equals: key, mode: "insensitive" }, approved: true },
    select: { vanityURL: true },
  });
  if (!creator?.vanityURL) notFound();
  permanentRedirect(`/creator/${creator.vanityURL}`);
}
