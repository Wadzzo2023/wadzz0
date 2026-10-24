"use client";

import { CheckCircle2, Layers, Lock, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardForm } from "~/components/payment/card-form";
import { CostBreakdown, ProblemList } from "~/components/payment/cost-breakdown";
import { Price } from "~/components/price/price";
import { MethodPicker, type PayMethod } from "~/components/payment/method-picker";
import { Button } from "~/components/shadcn/ui/button";
import { isCustodial } from "~/lib/custodial";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { MAX_PER_PURCHASE, formatAmount } from "~/lib/stellar/quote";
import { QuantityStepper } from "~/ui/quantity-stepper";
import { Skeleton } from "~/ui/skeleton";
import { StatusPill } from "~/ui/status-pill";
import { api, type RouterOutputs } from "~/utils/api";

type Item = RouterOutputs["market"]["item"];
type Listing = NonNullable<Item["original"]>;

/**
 * Buying one listing of an item: the creator's own by default, or a fan's
 * resale when the page was opened from one. The server checks everything
 * first and shows exactly what it will cost, so the buyer only signs a
 * transaction that will go through.
 */
export function BuyPanel({ item, listing }: { item: Item; listing: Listing | null }) {
  if (!listing) {
    return (
      <div className="border-foreground/15 rounded-[1.2rem] border-[3px] border-dashed p-6 text-center">
        <ShoppingBag className="text-muted-foreground mx-auto mb-2 size-6" />
        <p className="display text-2xl">Not for sale from the creator right now</p>
        <p className="text-muted-foreground mt-1 text-sm">{item.resales.length ? "Fans are reselling it — see the resale listings below." : "Nobody is selling this item at the moment."}</p>
      </div>
    );
  }
  return <Checkout key={listing.id} item={item} listing={listing} />;
}

function Checkout({ item, listing }: { item: Item; listing: Listing }) {
  const { signedIn, requireAuth, openSignIn, session } = useRequireAuth();
  // card payment is for custodial (email/social) accounts only
  const methods: PayMethod[] = isCustodial(session?.user.walletType) ? ["PLATFORM_ASSET", "XLM", "CARD"] : ["PLATFORM_ASSET", "XLM"];
  const [method, setMethod] = useState<PayMethod>("PLATFORM_ASSET");
  const [quantity, setQuantity] = useState(1);
  // Keep showing the last quote while a new quantity/method is priced.
  const quote = api.purchase.quote.useQuery(
    { listingId: listing.id, method, quantity },
    {
      enabled: signedIn,
      refetchOnWindowFocus: true,
      staleTime: 20_000,
      placeholderData: (prev) => prev,
    },
  );
  const maxQty = Math.max(1, Math.min(MAX_PER_PURCHASE, quote.data?.copiesLeft ?? MAX_PER_PURCHASE));
  const prepare = api.purchase.prepare.useMutation();
  const payByCard = api.purchase.payByCard.useMutation();
  const follow = api.creator.follow.useMutation();
  const sign = useSignAndConfirm();
  const utils = api.useUtils();
  const [done, setDone] = useState(false);
  const isResale = listing.placerId !== item.creatorId;
  const creatorHref = item.creator ? `/creator/${item.creator.vanityURL ?? item.creator.id}` : undefined;

  const finish = async (ok: boolean) => {
    if (!ok) return;
    setDone(true);
    await Promise.all([utils.content.access.invalidate({ assetId: item.id }), utils.market.item.invalidate({ assetId: item.id }), utils.wallet.balances.invalidate()]);
  };

  const buy = requireAuth(async () => {
    const res = await prepare
      .mutateAsync({
        listingId: listing.id,
        method: method === "XLM" ? "XLM" : "PLATFORM_ASSET",
        quantity,
      })
      .catch(() => null);
    if (!res) return;
    if (!res.ok) return void utils.purchase.quote.setData({ listingId: listing.id, method, quantity }, res.quote);
    await finish(await sign.run({ txId: res.txId, xdr: res.xdr }));
  });

  const payCard = async (t: { sourceId: string; verificationToken?: string }) => {
    const res = await payByCard.mutateAsync({ listingId: listing.id, quantity, ...t }).catch(() => null);
    if (!res) return;
    if (res.status === "sign") await finish(await sign.run({ txId: res.txId, xdr: res.xdr }));
    else await finish(true);
  };

  const followCreator = async () => {
    if (!item.creatorId) return;
    const res = await follow.mutateAsync({ creatorId: item.creatorId });
    if (res.xdr) await sign.signOnly(res.xdr);
    await quote.refetch();
  };

  if (done) {
    return (
      <div className="blob bg-primary text-primary-foreground space-y-3 p-5 text-center">
        <CheckCircle2 className="mx-auto size-9" strokeWidth={2.4} />
        <p className="display text-4xl">{quantity > 1 ? `${quantity} copies are yours!` : "It's yours!"}</p>
        <p className="marker text-sm">They&apos;re in your wallet, and the full content is unlocked.</p>
        <div className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/collection">
              <Layers className="size-4" /> My collection
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/activity">View receipt</Link>
          </Button>
        </div>
      </div>
    );
  }

  const q = quote.data;
  const busy = prepare.isPending || payByCard.isPending || sign.busy;
  const error = prepare.error?.message ?? payByCard.error?.message ?? sign.error;

  // Wide layout: what you're buying on the left (price, quantity, method), what it costs and the button on the right.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2 lg:gap-8">
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">
              {isResale ? "Resale price" : "Price"}
              {quantity > 1 && " · each"}
            </p>
            <Price tokens={listing.price} usd={listing.priceUSD} size="lg" gradient className="mt-0.5" />
          </div>
          {q &&
            (q.copiesLeft === 0 ? (
              <StatusPill tone="danger">Sold out</StatusPill>
            ) : (
              <StatusPill tone={q.source === "stock" ? "neutral" : "info"} icon={q.source === "stock" ? undefined : Sparkles}>
                {q.source === "stock" ? "In stock" : "Minted for you"}
                {q.copiesLeft != null && ` · ${q.copiesLeft} left`}
              </StatusPill>
            ))}
        </div>

        {signedIn && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label-caps">Quantity</p>
                <p className="text-muted-foreground text-xs">{!q ? "Checking availability…" : q.copiesLeft != null ? `${q.copiesLeft} available` : "Unlimited"}</p>
              </div>
              <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} disabled={busy} />
            </div>
            <MethodPicker value={method} onChange={setMethod} methods={methods} />
          </>
        )}
      </div>

      <div className="lg:border-foreground/10 space-y-4 lg:border-l-2 lg:border-dashed lg:pl-8">
        {!signedIn ? (
          <div className="flex h-full flex-col justify-center gap-2">
            <Button size="lg" className="w-full" onClick={openSignIn}>
              <span className="marker text-lg">Sign in to buy</span>
            </Button>
            <p className="text-muted-foreground text-center text-xs">You&apos;ll see the full cost before you pay.</p>
          </div>
        ) : (
          <>
            {quote.isError && !q ? (
              // The price check itself failed (as opposed to "you can't buy this"): say so and let them retry,
              // instead of spinning forever.
              <div className="tone-danger space-y-2 rounded-xl p-4" role="alert">
                <p className="text-sm font-semibold">We couldn&apos;t check the price right now.</p>
                <p className="text-xs opacity-80">{quote.error.message}</p>
                <Button variant="outline" size="sm" disabled={quote.isFetching} onClick={() => void quote.refetch()}>
                  {quote.isFetching ? "Checking…" : "Try again"}
                </Button>
              </div>
            ) : quote.isLoading || !q ? (
              <div className="space-y-2">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            ) : (
              <>
                <CostBreakdown lines={q.lines} total={q.total} currency={q.currency} balance={q.balance} collapsible />
                {q.payout.royalty > 0 && (
                  <p className="text-muted-foreground text-xs">
                    The seller receives {formatAmount(q.payout.seller, q.payout.currency)}; the creator earns {formatAmount(q.payout.royalty, q.payout.currency)} royalty.
                  </p>
                )}
                {q.problems.length > 0 && <ProblemList problems={q.problems} creatorHref={creatorHref} onFollow={followCreator} />}
                {method === "CARD" ? (
                  q.ok && <CardForm usd={q.total} disabled={busy} onToken={(t) => void payCard(t)} />
                ) : (
                  <Button size="lg" className="w-full" disabled={!q.ok || busy} onClick={buy}>
                    {sign.step === "signing"
                      ? "Confirm in your wallet…"
                      : sign.step === "confirming"
                        ? "Confirming on Stellar…"
                        : prepare.isPending
                          ? "Preparing…"
                          : `Buy ${quantity > 1 ? `${quantity} ` : ""}for ${formatAmount(q.total, q.currency)}`}
                  </Button>
                )}
                {item.privacy !== "PUBLIC" && !isResale && (
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Lock className="size-3.5" /> {item.privacy === "TIER" ? `For ${item.tier?.name ?? "tier"} members` : "For followers"} of {item.creator?.name}
                  </p>
                )}
              </>
            )}
            {error && <p className="tone-danger rounded-lg px-3 py-2 text-sm">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
