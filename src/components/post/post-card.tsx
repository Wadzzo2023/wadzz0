"use client";

import { formatDistanceToNow } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import { BadgeCheck, Heart, Lock, MessageCircle, SendHorizontal, Share2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
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
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const inputRef = useRef<HTMLInputElement>(null);
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
        {full ? (
          <Link href="#comments" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground">
            <MessageCircle className="size-4" /> {commentCount}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <MessageCircle className="size-4" /> {commentCount}
          </button>
        )}
        <button
          type="button"
          onClick={() => void share()}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <Share2 className="size-4" /> Share
        </button>
      </footer>

      {!full && <InlineComments post={post} href={href} count={commentCount} onAdded={() => setCommentCount((n) => n + 1)} inputRef={inputRef} />}
    </article>
  );
}

type RecentComment = PostData["recentComments"][number];

/**
 * The latest few comments under a post in a feed, plus a one-line box to add
 * one without leaving the feed. The full thread (and replies) is on the post
 * page via "View all".
 */
function InlineComments({
  post,
  href,
  count,
  onAdded,
  inputRef,
}: {
  post: PostData;
  href: string;
  count: number;
  onAdded: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { signedIn, session, openSignIn } = useRequireAuth();
  const [added, setAdded] = useState<RecentComment[]>([]);
  const [text, setText] = useState("");
  const add = api.post.comment.useMutation({
    onSuccess: (c) => {
      setAdded((a) => [...a, { id: c.id, content: c.content, createdAt: c.createdAt, userId: c.userId, user: { name: session?.user.name ?? null, image: session?.user.image ?? null } }]);
      setText("");
      onAdded();
    },
    onError: (e) => toast.error(e.message),
  });
  // the server's latest 3, then anything posted here, keeping the last 3
  const shown = [...post.recentComments, ...added].slice(-3);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) return openSignIn();
    if (text.trim()) add.mutate({ postId: post.id, content: text.trim() });
  };

  return (
    <div className="-mt-1 space-y-3">
      {count > shown.length && (
        <Link href={`${href}#comments`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          View all {count.toLocaleString("en-US")} comments
        </Link>
      )}
      {shown.length > 0 && (
        <ul className="space-y-2.5">
          {shown.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar src={c.user.image} name={c.user.name} className="size-7 text-[10px]" />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-foreground/[0.04] px-3 py-2">
                <p className="text-xs">
                  <span className="font-semibold">{c.user.name ?? "Fan"}</span>{" "}
                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                </p>
                <p className="line-clamp-3 whitespace-pre-line break-words text-sm text-foreground/90">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex items-center gap-2.5">
        <Avatar src={session?.user.image ?? null} name={session?.user.name ?? null} className="size-7 text-[10px]" />
        <div className="flex h-10 flex-1 items-center rounded-full bg-foreground/[0.04] pl-4 pr-1 ring-1 ring-foreground/[0.08] focus-within:ring-primary/50">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => !signedIn && openSignIn()}
            maxLength={2000}
            placeholder={signedIn ? "Write a comment…" : "Sign in to comment"}
            aria-label="Write a comment"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={add.isPending || (signedIn && !text.trim())}
            aria-label="Send comment"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </form>
    </div>
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
