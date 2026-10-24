"use client";

import { Image as ImageIcon, Lock, PenSquare, Video } from "lucide-react";

import { env } from "~/env";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { Avatar } from "~/ui/person";
import { api } from "~/utils/api";

/**
 * A "create post" box at the top of the feed. Posts are written in the brand
 * portal, so clicking it goes there: brands land on the new-post editor,
 * signed-in fans on brand onboarding, and signed-out visitors sign in first.
 */
export function Composer() {
  const { signedIn, session, openSignIn } = useRequireAuth();
  const me = api.user.me.useQuery(undefined, { enabled: signedIn, staleTime: 5 * 60_000 });
  const isBrand = Boolean(me.data?.creator && !me.data.creator.notCreatorButSeller);
  const portal = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  const href = isBrand ? `${portal}/posts/new` : `${portal}/onboarding`;
  const avatar = isBrand ? (me.data?.creator?.profileUrl ?? null) : (session?.user.image ?? null);
  const name = isBrand ? (me.data?.creator?.name ?? null) : (session?.user.name ?? null);
  const loading = signedIn && !me.data;
  const prompt = !signedIn || loading ? "Share something with your fans…" : isBrand ? `What's new, ${name ?? "there"}?` : "Create a brand to start posting…";

  const go = (e: React.MouseEvent) => {
    if (signedIn && !loading) return;
    e.preventDefault();
    if (!signedIn) openSignIn();
  };

  return (
    <a href={href} onClick={go} className="glass group block rounded-[1.6rem] p-4 transition-colors hover:border-foreground">
      <div className="flex items-center gap-3">
        <Avatar src={avatar} name={name} className="size-10" />
        <span className="flex h-11 flex-1 items-center rounded-xl bg-foreground/[0.04] px-4 text-sm text-muted-foreground ring-1 ring-foreground/[0.08] transition-colors group-hover:ring-primary/40">
          {prompt}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t-2 border-dashed border-foreground/10 pt-3 text-xs font-semibold text-muted-foreground">
        {[
          { icon: ImageIcon, label: "Photo" },
          { icon: Video, label: "Video" },
          { icon: Lock, label: "Members-only" },
        ].map((c) => (
          <span key={c.label} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors group-hover:text-foreground">
            <c.icon className="size-4 text-primary" /> <span className="hidden sm:inline">{c.label}</span>
          </span>
        ))}
        <span className="blob ml-auto inline-flex shrink-0 -rotate-2 items-center gap-1.5 bg-primary px-3.5 py-2 text-primary-foreground transition-transform group-hover:rotate-0">
          <PenSquare className="size-3.5" /> {isBrand || loading ? "Post" : signedIn ? "Create brand" : "Sign in"}
        </span>
      </div>
    </a>
  );
}
