import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Comments } from "~/components/post/comments";
import { PostCard } from "~/components/post/post-card";
import { serverApi } from "~/server/api/server";
import { PageBody } from "~/ui/page-header";

const getPost = cache(async (id: number) => {
  try {
    return await (await serverApi()).post.get({ id });
  } catch (e) {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") return null;
    throw e;
  }
});

async function load(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getPost(id) : null;
}

const plain = (html: string | null) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: PageProps<"/posts/[id]">): Promise<Metadata> {
  const post = await load(params);
  if (!post) return { title: "Post not found", robots: { index: false } };
  // Locked posts never expose their body, even to search engines.
  const description = (post.locked ? `A members-only post by ${post.creator.name} on Wadzzo.` : plain(post.content) || `A post by ${post.creator.name}`).slice(0, 180);
  const image = post.medias.find((m) => m.type === "IMAGE")?.url;
  return {
    title: `${post.heading} · ${post.creator.name}`,
    description,
    alternates: { canonical: `/posts/${post.id}` },
    openGraph: { title: post.heading, description, type: "article", images: image ? [image] : undefined },
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const post = await load(params);
  if (!post) notFound();
  return (
    <PageBody className="mx-auto max-w-2xl space-y-6">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/feed" className="hover:text-foreground">
          Feed
        </Link>
      </nav>
      <PostCard post={post} full />
      <Comments postId={post.id} />
    </PageBody>
  );
}
