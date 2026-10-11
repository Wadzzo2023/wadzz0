"use client";

import { CheckCircle2, Coins, Share2, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { CostBreakdown, ProblemList } from "~/components/payment/cost-breakdown";
import { MethodPicker } from "~/components/payment/method-picker";
import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { formatAmount } from "~/lib/stellar/quote";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { TierCard } from "./tier-card";

type Profile = RouterOutputs["creator"]["profile"];
type Offer = RouterOutputs["market"]["pageTokenSales"][number];

/** Follow / Following (also adds the brand's page-token trustline, paid by the platform). */
export function FollowButton({ creatorId, initial, className }: { creatorId: string; initial: boolean; className?: string }) {
  const { requireAuth } = useRequireAuth();
  const [following, setFollowing] = useState(initial);
  const follow = api.creator.follow.useMutation();
  const unfollow = api.creator.unfollow.useMutation();
  const sign = useSignAndConfirm();

  const toggle = requireAuth(async () => {
    if (following) {
      setFollowing(false);
      await unfollow.mutateAsync({ creatorId }).catch(() => setFollowing(true));
      return;
    }
    setFollowing(true);
    const res = await follow.mutateAsync({ creatorId }).catch(() => (setFollowing(false), null));
    if (res?.xdr) await sign.signOnly(res.xdr);
  });

  return (
    <Button
      onClick={toggle}
      variant={following ? "outline" : "default"}
      disabled={follow.isPending || unfollow.isPending || sign.busy}
      className={cn("rounded-full px-5", !following && "shadow-[0_0_24px_-6px_hsl(var(--primary)/0.8)]", className)}
    >
      {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {sign.busy ? "Confirm in wallet…" : following ? "Following" : "Follow"}
    </Button>
  );
}

export function ShareButton({ title }: { title: string }) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };
  return (
    <Button variant="outline" size="icon" className="glass rounded-full" onClick={() => void share()} aria-label="Share">
      <Share2 className="size-4" />
    </Button>
  );
}

/** Membership tiers, the viewer's standing, and the page-token packs that get them there. */
export function MembershipSection({ profile, offers }: { profile: Profile; offers: Offer[] }) {
  const code = profile.pageAsset?.code ?? "tokens";
  const [buying, setBuying] = useState<Offer | null>(null);
  const { requireAuth } = useRequireAuth();
  const held = profile.viewer.pageTokens;

  if (!profile.subscriptions.length && !offers.length) {
    return <EmptyState icon={Coins} title="No membership yet" description={`${profile.name} hasn't set up membership tiers.`} />;
  }
  return (
    <section id="tiers" className="scroll-mt-24 space-y-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <h2 className="font-hud text-lg font-bold">Membership</h2>
          <p className="text-sm text-muted-foreground">Hold {profile.name}&apos;s page token ({code}) to unlock members-only posts and items.</p>
        </div>
        {profile.viewer.signedIn && (
          <div className="rounded-xl bg-primary/10 px-4 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">You hold</p>
            <p className="font-hud text-lg font-bold tabular-nums">
              {held.toLocaleString()} <span className="text-sm text-muted-foreground">{code}</span>
            </p>
          </div>
        )}
      </div>

      {profile.subscriptions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.subscriptions.map((t) => (
            <TierCard key={t.id} tier={t} code={code} current={profile.viewer.tierId === t.id} reached={held >= t.price} />
          ))}
        </div>
      )}

      {offers.length > 0 && (
        <div className="space-y-2">
          <p className="label-caps">Get {code}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={requireAuth(() => setBuying(o))}
                className="glass flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:glow"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Coins className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {o.amountToSell.toLocaleString()} {code}
                  </span>
                </span>
                <span className="font-hud font-bold tabular-nums">{formatAmount(o.price, PLATFORM_ASSET.code)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {buying && <PageTokenDialog offer={buying} code={code} onClose={() => setBuying(null)} />}
    </section>
  );
}

function PageTokenDialog({ offer, code, onClose }: { offer: Offer; code: string; onClose: () => void }) {
  const [payIn, setPayIn] = useState<"PLATFORM_ASSET" | "XLM">("PLATFORM_ASSET");
  const quote = api.creator.pageTokenQuote.useQuery({ saleId: offer.id, payIn });
  const prepare = api.creator.pageTokenPrepare.useMutation();
  const sign = useSignAndConfirm();
  const utils = api.useUtils();

  const go = async () => {
    const res = await prepare.mutateAsync({ saleId: offer.id, payIn }).catch(() => null);
    if (res?.ok && (await sign.run({ txId: res.txId, xdr: res.xdr }))) await utils.creator.profile.invalidate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-hud">{offer.title}</DialogTitle>
          <DialogDescription>
            {offer.amountToSell.toLocaleString()} {code} from {offer.placer?.name}.{offer.description ? ` ${offer.description}` : ""}
          </DialogDescription>
        </DialogHeader>
        {sign.step === "done" ? (
          <div className="space-y-3 py-4 text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary" />
            <p className="font-hud font-semibold">
              {offer.amountToSell.toLocaleString()} {code} added to your wallet
            </p>
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <MethodPicker value={payIn} onChange={(m) => setPayIn(m as "PLATFORM_ASSET" | "XLM")} methods={["PLATFORM_ASSET", "XLM"]} />
            {quote.data ? (
              <>
                <CostBreakdown lines={quote.data.lines} total={quote.data.total} currency={quote.data.currency} balance={quote.data.balance} />
                {quote.data.problems.length > 0 && <ProblemList problems={quote.data.problems} />}
              </>
            ) : (
              <Skeleton className="h-36 rounded-xl" />
            )}
            {(prepare.error ?? sign.error) && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{prepare.error?.message ?? sign.error}</p>}
            <Button className="h-11 w-full rounded-xl font-bold" disabled={!quote.data?.ok || prepare.isPending || sign.busy} onClick={() => void go()}>
              {sign.step === "signing" ? "Confirm in your wallet…" : sign.step === "confirming" ? "Confirming on Stellar…" : quote.data ? `Pay ${formatAmount(quote.data.total, quote.data.currency)}` : "Pay"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
