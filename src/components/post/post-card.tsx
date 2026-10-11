"use client";

import { formatDistanceToNow } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import { BadgeCheck, Heart, Lock, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { creatorHref } from "~/lib/creator";
import { tierColor } from "~/components/creator/tier-card";
import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { api, type RouterOutputs } from "~/utils/api";

export type PostData = RouterOutputs["post"]["feed"]["items"][number];

/**
 * Sanitized HTML from the brand's editor. The editor saves spaces as &nbsp;,
 * which stops lines wrapping, so those become plain spaces first.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(html.replace(/&nbsp;|\u00a0/g, " "));
  return <div className={cn("prose prose-sm max-w-none break-words dark:prose-invert prose-a:text-primary", className)} dangerouslySetInnerHTML={{ __html: clean }} />;
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
    <article className="glass space-y-4 rounded-2xl p-4 transition-shadow hover:shadow-[0_20px_50px_-30px_hsl(var(--primary)/0.6)] sm:p-5">
      <header className="flex items-center gap-3">
        <Link href={creatorHref(post.creator)} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[2px]">
            <span className="block rounded-full bg-background p-[2px]">
              <Avatar src={post.creator.profileUrl} name={post.creator.name} className="size-10" />
            </span>
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-sm font-semibold">
              <span className="truncate">{post.creator.name}</span>
              <BadgeCheck className="size-4 shrink-0 text-primary" />
            </span>
            <time dateTime={new Date(post.createdAt).toISOString()} className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </time>
          </span>
        </Link>
        {post.subscription && (
          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", tierColor(post.subscription.color).chip)}>
            <Lock className="size-3" /> {post.subscription.name}
          </span>
        )}
      </header>

      <div className="space-y-2">
        {full ? (
          <h1 className="font-hud text-2xl font-bold leading-tight tracking-tight">{post.heading}</h1>
        ) : (
          <Link href={href} className="block font-hud text-lg font-bold leading-snug transition-colors hover:text-primary">
            {post.heading}
          </Link>
        )}
        {!post.locked && post.content && <RichText html={post.content} className={cn("text-foreground/85", !full && "max-h-36 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]")} />}
      </div>

      {post.locked ? (
        <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)] px-4 py-10 text-center ring-1 ring-primary/20">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_30px_-8px_hsl(var(--primary)/0.8)]">
            <Lock className="size-5" />
          </span>
          <p className="font-hud font-semibold">For {post.unlock?.tierName} members</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Hold {post.unlock?.price.toLocaleString("en-US")} {post.unlock?.code ?? "page tokens"} of {post.creator.name} to read this post
            {post.lockedMedia.length > 0 && ` and see its ${post.lockedMedia.length} attachment${post.lockedMedia.length > 1 ? "s" : ""}`}.
          </p>
          <Button asChild size="sm" className="mt-1 rounded-xl">
            <Link href={`${creatorHref(post.creator)}#tiers`}>Unlock with membership</Link>
          </Button>
        </div>
      ) : (
        post.medias.length > 0 && <MediaGrid medias={post.medias} href={full ? null : href} />
      )}

      <footer className="flex items-center gap-1 border-t border-foreground/[0.06] pt-3 text-sm">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          className={cn("inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-semibold tabular-nums transition-colors hover:bg-foreground/[0.05]", liked ? "text-rose-500" : "text-muted-foreground hover:text-foreground")}
        >
          <Heart className={cn("size-4", liked && "fill-current")} /> {likes}
        </button>
        <Link href={`${href}#comments`} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground">
          <MessageCircle className="size-4" /> {post._count.comments}
        </Link>
        <button
          type="button"
          onClick={() => void share()}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <Share2 className="size-4" /> Share
        </button>
      </footer>
    </article>
  );
}

type Media = PostData["medias"][number];

/** 1 item full width; 2 side by side; 3 as one big + two stacked; 4+ as a 2×2 with "+N" on the last tile. */
function MediaGrid({ medias, href }: { medias: Media[]; href: string | null }) {
  const shown = href ? medias.slice(0, 4) : medias;
  const extra = medias.length - shown.length;
  const audio = shown.filter((m) => m.type === "MUSIC");
  const visual = shown.filter((m) => m.type !== "MUSIC");
  const n = visual.length;

  return (
    <div className="space-y-2">
      {n > 0 && (
        <div className={cn("grid gap-1.5 overflow-hidden rounded-xl", n === 1 ? "grid-cols-1" : "grid-cols-2", n === 3 && "grid-rows-2")}>
          {visual.map((m, i) => (
            <div key={m.id} className={cn("relative overflow-hidden bg-black", n === 1 ? "max-h-[32rem]" : "aspect-square", n === 3 && i === 0 && "row-span-2 aspect-auto")}>
              {m.type === "VIDEO" ? (
                <video src={m.url} controls playsInline preload="metadata" className="size-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" loading="lazy" className={cn("size-full object-cover", n === 1 && "max-h-[32rem]")} />
              )}
              {extra > 0 && i === n - 1 && href && (
                <Link href={href} className="absolute inset-0 flex items-center justify-center bg-black/55 font-hud text-2xl font-bold text-white">
                  +{extra}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      {audio.map((m) => (
        <audio key={m.id} src={m.url} controls className="w-full" />
      ))}
    </div>
  );
}
