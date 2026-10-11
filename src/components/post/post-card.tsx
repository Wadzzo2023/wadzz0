"use client";

import { formatDistanceToNow } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import { Heart, Lock, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { creatorHref } from "~/components/creator/creator-card";
import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { api, type RouterOutputs } from "~/utils/api";

export type PostData = RouterOutputs["post"]["feed"]["items"][number];

/** Sanitized HTML from the brand's editor. */
export function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose prose-sm max-w-none dark:prose-invert prose-a:text-primary", className)} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

/** A post in a feed; members-only posts arrive locked and show what unlocks them. */
export function PostCard({ post, full = false }: { post: PostData; full?: boolean }) {
  const { requireAuth } = useRequireAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post._count.likes);
  const like = api.post.like.useMutation({ onError: () => (setLiked((l) => !l), setLikes((n) => n + (liked ? 1 : -1))) });
  const href = `/posts/${post.id}`;

  const toggleLike = requireAuth(() => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    like.mutate({ postId: post.id, liked: next });
  });

  const share = async () => {
    const url = `${window.location.origin}${href}`;
    if (navigator.share) await navigator.share({ title: post.heading, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <article className="glass space-y-3 rounded-2xl p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <Link href={creatorHref(post.creator)} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={post.creator.profileUrl} name={post.creator.name} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{post.creator.name}</span>
            <time dateTime={new Date(post.createdAt).toISOString()} className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </time>
          </span>
        </Link>
        {post.subscription && (
          <span className="inline-flex items-center gap-1 rounded-full tone-neutral px-2 py-0.5 text-[11px] font-semibold">
            <Lock className="size-3" /> {post.subscription.name}
          </span>
        )}
      </header>

      {full ? <h1 className="font-hud text-xl font-bold">{post.heading}</h1> : (
        <Link href={href} className="block font-hud text-base font-semibold hover:underline">
          {post.heading}
        </Link>
      )}

      {post.locked ? (
        <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border border-dashed border-primary/30 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)] px-4 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-5" />
          </span>
          <p className="font-hud font-semibold">For {post.unlock?.tierName} members</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Hold {post.unlock?.price} {post.unlock?.code ?? "page tokens"} of {post.creator.name} to read this post
            {post.lockedMedia.length > 0 && ` and see its ${post.lockedMedia.length} attachment${post.lockedMedia.length > 1 ? "s" : ""}`}.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link href={`${creatorHref(post.creator)}#tiers`}>See membership</Link>
          </Button>
        </div>
      ) : (
        <>
          {post.content && <RichText html={post.content} className={cn(!full && "line-clamp-6")} />}
          {post.medias.length > 0 && (
            <div className={cn("grid gap-2", post.medias.length > 1 && "grid-cols-2")}>
              {post.medias.slice(0, full ? undefined : 4).map((m) =>
                m.type === "VIDEO" ? (
                  <video key={m.id} src={m.url} controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-black object-contain" />
                ) : m.type === "MUSIC" ? (
                  <audio key={m.id} src={m.url} controls className="w-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={m.id} src={m.url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                ),
              )}
            </div>
          )}
        </>
      )}

      <footer className="flex items-center gap-1 border-t border-foreground/[0.06] pt-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={toggleLike} aria-pressed={liked} className={cn(liked && "text-destructive")}>
          <Heart className={cn("size-4", liked && "fill-current")} /> {likes}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${href}#comments`}>
            <MessageCircle className="size-4" /> {post._count.comments}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void share()} aria-label="Share">
          <Share2 className="size-4" />
        </Button>
      </footer>
    </article>
  );
}
