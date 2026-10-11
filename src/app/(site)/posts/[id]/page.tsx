import { TRPCError } from "@trpc/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Comments } from "~/components/post/comments";
import { PostCard } from "~/components/post/post-card";
import { PostSidebar } from "~/components/post/post-sidebar";
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
  const api = await serverApi();
  const [profile, recent] = await Promise.all([
    api.creator.profile({ key: post.creator.id }).catch(() => null),
    api.post.feed({ creatorId: post.creator.id, limit: 4 }),
  ]);
  const more = recent.items.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <PageBody wide className="space-y-5">
      <Link href="/feed" className="glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Feed
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <PostCard post={post} full />
          <Comments postId={post.id} />
        </div>
        {profile && <PostSidebar post={post} profile={profile} more={more} />}
      </div>
    </PageBody>
  );
}
