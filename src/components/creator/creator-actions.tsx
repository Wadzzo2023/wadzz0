"use client";

import { CheckCircle2, Coins, Share2, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { CostBreakdown, ProblemList } from "~/components/payment/cost-breakdown";
import { MethodPicker } from "~/components/payment/method-picker";
import { Price } from "~/components/price/price";
import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useFollow } from "~/hooks/use-follow";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { TierCard } from "./tier-card";
import { Amount } from "~/components/price/amount";

type Profile = RouterOutputs["creator"]["profile"];
type Offer = RouterOutputs["market"]["pageTokenSales"][number];

/** Follow / Following. For brands with a page token, following also adds that token's trustline (paid by the platform) and only counts once it's on Stellar. */
export function FollowButton({ creatorId, initial, className }: { creatorId: string; initial: boolean; className?: string }) {
  const { requireAuth } = useRequireAuth();
  const [following, setFollowing] = useState(initial);
  const unfollow = api.creator.unfollow.useMutation();
  const follow = useFollow();

  const toggle = requireAuth(async () => {
    if (following) {
      setFollowing(false);
      await unfollow.mutateAsync({ creatorId }).catch(() => setFollowing(true));
      return;
    }
    // not "Following" until it's saved: without a page token that's immediate, with one it waits for the trustline
    setFollowing(await follow.run(creatorId));
  });

  return (
    <Button onClick={toggle} variant={following ? "outline" : "default"} disabled={follow.busy || unfollow.isPending} className={cn("rounded-full px-5", className)}>
      {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {follow.stage === "signing" ? "Confirm in wallet…" : follow.stage === "confirming" ? "Confirming…" : follow.stage === "preparing" ? "Following…" : following ? "Following" : "Follow"}
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
    <Button variant="outline" size="icon" className="rounded-full" onClick={() => void share()} aria-label="Share">
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
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] p-4">
        <div>
          <h2 className="display text-3xl">Membership</h2>
          <p className="text-sm text-muted-foreground">Hold {profile.name}&apos;s page token ({code}) to unlock members-only posts and items.</p>
        </div>
        {profile.viewer.signedIn && (
          <div className="rounded-xl bg-primary/10 px-4 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">You hold</p>
            <p className="display text-3xl tabular-nums">
              {held.toLocaleString("en-US")} <span className="text-sm text-muted-foreground">{code}</span>
            </p>
          </div>
        )}
      </div>

      {profile.subscriptions.length > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.subscriptions.map((t) => (
            <TierCard key={t.id} tier={t} code={code} current={profile.viewer.tierId === t.id} reached={held >= t.price} />
          ))}
        </div>
      )}

      {offers.length > 0 && (
        <div className="space-y-2">
          <p className="label-caps">Get {code}</p>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={requireAuth(() => setBuying(o))}
                className="glass flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:border-foreground"
              >
                <span className="flex size-10 shrink-0 items-center justify-center blob bg-primary text-primary-foreground">
                  <Coins className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {o.amountToSell.toLocaleString("en-US")} {code}
                  </span>
                </span>
                <Price tokens={o.price} usd={o.priceUSD} size="sm" className="shrink-0 items-end text-right" />
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
          <DialogTitle className="display text-2xl">{offer.title}</DialogTitle>
          <DialogDescription>
            {offer.amountToSell.toLocaleString("en-US")} {code} from {offer.placer?.name}.{offer.description ? ` ${offer.description}` : ""}
          </DialogDescription>
        </DialogHeader>
        {sign.step === "done" ? (
          <div className="space-y-3 py-4 text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary" />
            <p className="display text-2xl">
              {offer.amountToSell.toLocaleString("en-US")} {code} added to your wallet
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
            <Button className="h-11 w-full font-bold" disabled={!quote.data?.ok || prepare.isPending || sign.busy} onClick={() => void go()}>
              {sign.step === "signing" ? "Confirm in your wallet…" : sign.step === "confirming" ? "Confirming on Stellar…" : quote.data ? (
                <>
                  Pay <Amount value={quote.data.total} currency={quote.data.currency} />
                </>
              ) : (
                "Pay"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
