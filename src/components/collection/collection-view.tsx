"use client";

import { ExternalLink, Layers, Pencil, Play, Repeat2, Sparkles, Store, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MEDIA_META } from "~/components/media/media-meta";
import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { env } from "~/env";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { ErrorState } from "~/ui/error-state";
import { PageBody } from "~/ui/page-header";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { ListDialog, StorageSetupDialog } from "./resale-dialogs";

type Owned = RouterOutputs["collection"]["owned"][number];
type Created = RouterOutputs["collection"]["created"][number];
type Tab = "owned" | "selling" | "created";

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
const glassBadge = "flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md";

/** Everything I own, what I'm reselling, and (for creators) what I made. */
export function CollectionView() {
  const owned = api.collection.owned.useQuery();
  const storage = api.collection.storage.useQuery();
  const created = api.collection.created.useQuery();
  const [tab, setTab] = useState<Tab>("owned");
  const [listing, setListing] = useState<Owned | null>(null);
  const [setup, setSetup] = useState<Owned | null>(null);

  const ownedItems = owned.data?.filter((x) => x.owned > 0) ?? [];
  const selling = owned.data?.filter((x) => x.listing) ?? [];
  const copies = ownedItems.reduce((s, x) => s + x.owned, 0);
  const listedCopies = owned.data?.reduce((s, x) => s + x.listed, 0) ?? 0;
  const isCreator = (created.data?.length ?? 0) > 0;

  const resell = (x: Owned) => (storage.data?.exists && storage.data.active ? setListing(x) : setSetup(x));

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "owned", label: "Owned", count: ownedItems.length },
    { id: "selling", label: "Selling", count: selling.length },
    ...(isCreator ? [{ id: "created" as const, label: "Created", count: created.data?.length }] : []),
  ];

  return (
    <PageBody wide className="space-y-6">
      <header className="space-y-4">
        <div>
          <p className="label-caps text-primary">You</p>
          <h1 className="font-hud text-3xl font-bold tracking-tight sm:text-4xl">
            My <span className="text-gradient">collection</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Items you bought, claimed or were gifted. Open one to play its full content, or resell it to other fans.</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 sm:max-w-xl">
          {[
            ["Items", ownedItems.length],
            ["Copies", copies],
            ["Listed for resale", listedCopies],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-xl p-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="font-hud text-2xl font-bold tabular-nums">{owned.data ? num.format(v as number) : "–"}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="glass flex w-fit gap-1 rounded-xl p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count != null && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", tab === t.id ? "bg-black/15" : "bg-foreground/10")}>{t.count}</span>}
          </button>
        ))}
      </div>

      {owned.isLoading ? (
        <div className={grid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : owned.error ? (
        <ErrorState message={owned.error.message} onRetry={() => void owned.refetch()} />
      ) : tab === "owned" ? (
        ownedItems.length ? (
          <div className={grid}>
            {ownedItems.map((x) => (
              <OwnedCard key={x.asset.id} x={x} onResell={() => resell(x)} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Layers} title="No items yet" description="Items you buy, claim or receive as gifts show up here." action={<Button asChild className="rounded-xl"><Link href="/marketplace">Browse the marketplace</Link></Button>} />
        )
      ) : tab === "selling" ? (
        selling.length ? (
          <div className={grid}>
            {selling.map((x) => (
              <SellingCard key={x.asset.id} x={x} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Store} title="Nothing listed" description="Resell an item from the Owned tab — it waits in your storage until someone buys it." />
        )
      ) : (
        <div className={grid}>
          {created.data?.map((a) => (
            <CreatedCard key={a.id} a={a} />
          ))}
        </div>
      )}

      {setup && (
        <StorageSetupDialog
          open
          onOpenChange={(o) => !o && setSetup(null)}
          onDone={() => {
            void storage.refetch();
            setListing(setup);
            setSetup(null);
          }}
        />
      )}
      {listing && (
        <ListDialog
          open
          onOpenChange={(o) => !o && setListing(null)}
          item={{ assetId: listing.asset.id, name: listing.asset.name, owned: listing.owned, royaltyPercent: listing.asset.royaltyPercent, currentPrice: listing.listing?.price }}
        />
      )}
    </PageBody>
  );
}

function Art({ id, thumbnail, name, mediaType, children }: { id: number; thumbnail: string; name: string; mediaType: Owned["asset"]["mediaType"]; children?: React.ReactNode }) {
  const meta = MEDIA_META[mediaType];
  return (
    <Link href={`/item/${id}`} className="relative block aspect-square overflow-hidden rounded-xl bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt={name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <span className={cn(glassBadge, "absolute left-2 top-2")}>
        <meta.icon className="size-3" /> {meta.label}
      </span>
      {children}
    </Link>
  );
}

const card = "glass group flex flex-col rounded-2xl p-2 transition-all duration-300 hover:glow hover:-translate-y-1";

function OwnedCard({ x, onResell }: { x: Owned; onResell: () => void }) {
  return (
    <div className={card}>
      <Art id={x.asset.id} thumbnail={x.asset.thumbnail} name={x.asset.name} mediaType={x.asset.mediaType}>
        {x.owned > 1 && <span className={cn(glassBadge, "absolute right-2 top-2")}>×{x.owned}</span>}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_-4px_hsl(var(--primary)/0.9)]">
            <Play className="ml-0.5 size-5" />
          </span>
        </span>
      </Art>
      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1 pt-2.5">
        <p className="truncate font-hud text-[15px] font-semibold">{x.asset.name}</p>
        <p className="truncate text-xs text-muted-foreground">{x.asset.creator?.name ?? "Wadzzo"}</p>
        {x.listed > 0 && <p className="text-xs font-medium text-primary">{x.listed} listed for resale</p>}
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link href={`/item/${x.asset.id}`}>Open</Link>
          </Button>
          <Button size="sm" className="rounded-lg" onClick={onResell}>
            <Repeat2 className="size-3.5" /> Resell
          </Button>
        </div>
      </div>
    </div>
  );
}

function SellingCard({ x }: { x: Owned }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(x.listing?.price ?? 0);
  const update = api.collection.updatePrice.useMutation({ onSuccess: () => setEditing(false) });
  const unlist = api.collection.unlistPrepare.useMutation();
  const sign = useSignAndConfirm();
  const utils = api.useUtils();
  if (!x.listing) return null;

  const takeBack = async () => {
    const res = await unlist.mutateAsync({ listingId: x.listing!.id }).catch(() => null);
    if (!res) return;
    if (res.txId) await sign.run({ txId: res.txId, xdr: res.xdr });
    await utils.collection.owned.invalidate();
  };

  return (
    <div className={card}>
      <Art id={x.asset.id} thumbnail={x.asset.thumbnail} name={x.asset.name} mediaType={x.asset.mediaType}>
        <span className={cn(glassBadge, "absolute right-2 top-2")}>{x.listed} in storage</span>
      </Art>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1 pt-2.5">
        <p className="truncate font-hud text-[15px] font-semibold">{x.asset.name}</p>
        <div className="rounded-xl bg-foreground/[0.04] px-2.5 py-2 ring-1 ring-foreground/[0.06]">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your price</p>
          <p className="font-hud text-sm font-bold tabular-nums">
            {num.format(x.listing.price)} <span className="text-xs text-primary">{PLATFORM_ASSET.code}</span>
          </p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> Price
          </Button>
          <Button size="sm" variant="ghost" className="rounded-lg" disabled={unlist.isPending || sign.busy} onClick={() => void takeBack()}>
            <Undo2 className="size-3.5" /> {sign.busy ? "…" : "Take back"}
          </Button>
        </div>
        {(unlist.error ?? sign.error) && <p className="text-xs text-destructive">{unlist.error?.message ?? sign.error}</p>}
      </div>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-hud">Change price</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="number" min={0} step="any" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} aria-label={`Price in ${PLATFORM_ASSET.code}`} />
            <Button className="w-full rounded-xl" disabled={price <= 0 || update.isPending} onClick={() => update.mutate({ listingId: x.listing!.id, price })}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreatedCard({ a }: { a: Created }) {
  const pct = a.limit ? Math.min(100, Math.round((a.mintedCount / a.limit) * 100)) : null;
  return (
    <div className={card}>
      <Art id={a.id} thumbnail={a.thumbnail} name={a.name} mediaType={a.mediaType}>
        {a.marketItems.length > 0 && (
          <span className={cn(glassBadge, "absolute right-2 top-2")}>
            <Sparkles className="size-3" /> On sale
          </span>
        )}
      </Art>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1 pt-2.5">
        <p className="truncate font-hud text-[15px] font-semibold">{a.name}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Stock</span>
            <span className="font-semibold tabular-nums text-foreground">{a.stock.toLocaleString("en-US")}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minted</span>
            <span className="tabular-nums">
              {a.mintedCount.toLocaleString("en-US")}
              {a.limit != null && ` / ${a.limit.toLocaleString("en-US")}`}
            </span>
          </div>
          {pct != null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          )}
        </div>
        <Button asChild size="sm" variant="outline" className="mt-auto rounded-lg">
          <a href={`${env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "")}/stores/${a.id}`} target="_blank" rel="noreferrer">
            Manage <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
