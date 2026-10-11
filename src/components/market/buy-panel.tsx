"use client";

import { CheckCircle2, Layers, Lock, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardForm } from "~/components/payment/card-form";
import { CostBreakdown, ProblemList } from "~/components/payment/cost-breakdown";
import { Price } from "~/components/price/price";
import { MethodPicker, type PayMethod } from "~/components/payment/method-picker";
import { Button } from "~/components/shadcn/ui/button";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { MAX_PER_PURCHASE, formatAmount } from "~/lib/stellar/quote";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { QuantityStepper } from "~/ui/quantity-stepper";
import { Skeleton } from "~/ui/skeleton";
import { StatusPill } from "~/ui/status-pill";
import { api, type RouterOutputs } from "~/utils/api";

type Item = RouterOutputs["market"]["item"];
type Listing = NonNullable<Item["original"]>;

/**
 * Buying an item: pick a listing (the creator's or a resale) and how to pay;
 * the server checks everything first and shows exactly what it will cost, so
 * the buyer only signs a transaction that will go through.
 */
export function BuyPanel({ item }: { item: Item }) {
  const listings = [...(item.original ? [item.original] : []), ...item.resales];
  const [listingId, setListingId] = useState<number | undefined>(listings[0]?.id);
  const listing = listings.find((l) => l.id === listingId);

  if (!listing) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <ShoppingBag className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="font-hud font-semibold">Not for sale right now</p>
        <p className="mt-1 text-sm text-muted-foreground">Nobody is selling this item at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.length > 1 && (
        <div className="space-y-2">
          <p className="label-caps">Choose a seller</p>
          <div className="space-y-1.5">
            {listings.map((l) => (
              <ListingOption key={l.id} l={l} item={item} active={l.id === listingId} onSelect={() => setListingId(l.id)} />
            ))}
          </div>
        </div>
      )}
      <Checkout key={listing.id} item={item} listing={listing} />
    </div>
  );
}

function ListingOption({ l, item, active, onSelect }: { l: Listing; item: Item; active: boolean; onSelect: () => void }) {
  const original = l.placerId === item.creatorId;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn("flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors", active ? "border-primary/60 bg-primary/5" : "hover:border-line-bright")}
    >
      <Avatar src={l.placer?.profileUrl} name={l.placer?.name} className="size-8" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{l.placer?.name ?? "Seller"}</span>
        <span className="text-xs text-muted-foreground">{original ? "From the creator" : "Resale"}</span>
      </span>
      <Price tokens={l.price} usd={l.priceUSD} size="sm" className="items-end text-right" />
    </button>
  );
}

function Checkout({ item, listing }: { item: Item; listing: Listing }) {
  const { signedIn, requireAuth, openSignIn } = useRequireAuth();
  const [method, setMethod] = useState<PayMethod>("PLATFORM_ASSET");
  const [quantity, setQuantity] = useState(1);
  // Keep showing the last quote while a new quantity/method is priced.
  const quote = api.purchase.quote.useQuery(
    { listingId: listing.id, method, quantity },
    { enabled: signedIn, refetchOnWindowFocus: true, staleTime: 20_000, placeholderData: (prev) => prev },
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
    const res = await prepare.mutateAsync({ listingId: listing.id, method: method === "XLM" ? "XLM" : "PLATFORM_ASSET", quantity }).catch(() => null);
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
      <div className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-5 text-center">
        <CheckCircle2 className="mx-auto size-8 text-primary" />
        <p className="font-hud text-lg font-bold">{quantity > 1 ? `${quantity} copies are yours!` : "It's yours!"}</p>
        <p className="text-sm text-muted-foreground">They&apos;re in your wallet, and the full content is unlocked.</p>
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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label-caps">{isResale ? "Resale price" : "Price"}{quantity > 1 && " · each"}</p>
          <Price tokens={listing.price} usd={listing.priceUSD} size="xl" gradient className="mt-0.5" />
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

      {!signedIn ? (
        <Button size="lg" className="h-12 w-full rounded-xl text-base font-bold shadow-[0_0_30px_-6px_hsl(var(--primary)/0.8)]" onClick={openSignIn}>
          Sign in to buy
        </Button>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-caps">Quantity</p>
              <p className="text-xs text-muted-foreground">{!q ? "Checking availability…" : q.copiesLeft != null ? `${q.copiesLeft} available` : "Unlimited"}</p>
            </div>
            <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} disabled={busy} />
          </div>
          <MethodPicker value={method} onChange={setMethod} methods={["PLATFORM_ASSET", "XLM", "CARD"]} />
          {quote.isLoading || !q ? (
            <div className="space-y-2">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : (
            <>
              <CostBreakdown lines={q.lines} total={q.total} currency={q.currency} balance={q.balance} collapsible />
              {q.payout.royalty > 0 && (
                <p className="text-xs text-muted-foreground">
                  The seller receives {formatAmount(q.payout.seller, q.payout.currency)}; the creator earns {formatAmount(q.payout.royalty, q.payout.currency)} royalty.
                </p>
              )}
              {q.problems.length > 0 && <ProblemList problems={q.problems} creatorHref={creatorHref} onFollow={followCreator} />}
              {method === "CARD" ? (
                q.ok && <CardForm usd={q.total} disabled={busy} onToken={(t) => void payCard(t)} />
              ) : (
                <Button size="lg" className="h-12 w-full rounded-xl text-base font-bold shadow-[0_0_30px_-6px_hsl(var(--primary)/0.8)] disabled:shadow-none" disabled={!q.ok || busy} onClick={buy}>
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
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-3.5" /> {item.privacy === "TIER" ? `For ${item.tier?.name ?? "tier"} members` : "For followers"} of {item.creator?.name}
                </p>
              )}
            </>
          )}
          {error && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{error}</p>}
        </>
      )}
    </div>
  );
}
