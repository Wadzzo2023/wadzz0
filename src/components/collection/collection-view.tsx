"use client";

import { Copy, ExternalLink, Layers, Pencil, Play, Repeat2, Sparkles, Store, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MEDIA_META } from "~/components/media/media-meta";
import { Price } from "~/components/price/price";
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
import { PageHero } from "~/ui/page-hero";
import { Skeleton } from "~/ui/skeleton";
import { artChip as glassBadge, stickerCard, wordTab, wordTabList, wordTabOff, wordTabOn } from "~/ui/styles";
import { SearchInput } from "~/ui/toolbar";
import { api, type RouterOutputs } from "~/utils/api";

import { ListDialog, StorageSetupDialog } from "./resale-dialogs";

type Owned = RouterOutputs["collection"]["owned"][number];
type Created = RouterOutputs["collection"]["created"][number];
type Tab = "owned" | "selling" | "created";

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

/** Everything I own, what I'm reselling, and (for creators) what I made. */
export function CollectionView() {
  const owned = api.collection.owned.useQuery();
  const storage = api.collection.storage.useQuery();
  const created = api.collection.created.useQuery();
  const [tab, setTab] = useState<Tab>("owned");
  const [listing, setListing] = useState<Owned | null>(null);
  const [setup, setSetup] = useState<Owned | null>(null);

  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);

  const ownedItems = owned.data?.filter((x) => x.owned > 0) ?? [];
  const selling = owned.data?.filter((x) => x.listing) ?? [];
  const shownOwned = ownedItems.filter((x) => match(x.asset.name));
  const shownSelling = selling.filter((x) => match(x.asset.name));
  const shownCreated = created.data?.filter((a) => match(a.name)) ?? [];
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
    <>
      <PageHero
        eyebrow="You"
        title={
          <>
            My <span className="text-primary">collection</span>
          </>
        }
        description="items you bought, claimed or were gifted — open one to play it, or resell it to other fans!"
        image={ownedItems[0]?.asset.thumbnail ?? created.data?.[0]?.thumbnail ?? null}
        stats={[
          { icon: Layers, label: "Items", value: owned.data ? num.format(ownedItems.length) : "–" },
          { icon: Copy, label: "Copies", value: owned.data ? num.format(copies) : "–" },
          { icon: Store, label: "Listed for resale", value: owned.data ? num.format(listedCopies) : "–" },
        ]}
      />

      <PageBody wide className="space-y-6 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className={cn(wordTabList, "flex-1")} role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(wordTab, tab === t.id ? wordTabOn : wordTabOff)}
              >
                {t.label}
                {t.count != null && <span className={cn("rounded-full px-2 font-sans text-xs font-bold tabular-nums", tab === t.id ? "bg-primary text-primary-foreground" : "bg-foreground/10")}>{t.count}</span>}
              </button>
            ))}
          </div>
          <SearchInput value={search} onSearch={setSearch} placeholder="Search your items" />
        </div>

        {owned.isLoading ? (
          <div className={grid}>
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-[1.4rem]" />
            ))}
          </div>
        ) : owned.error ? (
          <ErrorState message={owned.error.message} onRetry={() => void owned.refetch()} />
        ) : tab === "owned" ? (
          shownOwned.length ? (
            <div className={grid}>
              {shownOwned.map((x) => (
                <OwnedCard key={x.asset.id} x={x} onResell={() => resell(x)} />
              ))}
            </div>
          ) : q && ownedItems.length ? (
            <EmptyState icon={Layers} title="No items match" description="Try a different name." />
          ) : (
            <EmptyState icon={Layers} title="No items yet" description="Items you buy, claim or receive as gifts show up here." action={<Button asChild size="lg"><Link href="/marketplace"><span className="marker">Browse the marketplace</span></Link></Button>} />
          )
        ) : tab === "selling" ? (
          shownSelling.length ? (
            <div className={grid}>
              {shownSelling.map((x) => (
                <SellingCard key={x.asset.id} x={x} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Store} title={q && selling.length ? "No listings match" : "Nothing listed"} description="Resell an item from the Owned tab — it waits in your storage until someone buys it." />
          )
        ) : (
          <div className={grid}>
            {shownCreated.map((a) => (
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
    </>
  );
}

function Art({ id, thumbnail, name, mediaType, children }: { id: number; thumbnail: string; name: string; mediaType: Owned["asset"]["mediaType"]; children?: React.ReactNode }) {
  const meta = MEDIA_META[mediaType];
  return (
    <Link href={`/item/${id}`} className="relative block aspect-square overflow-hidden rounded-[1rem] bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnail} alt={name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <span className={cn(glassBadge, "absolute left-2 top-2")}>
        <meta.icon className="size-3" /> {meta.label}
      </span>
      {children}
    </Link>
  );
}

const card = `${stickerCard} flex flex-col`;

function OwnedCard({ x, onResell }: { x: Owned; onResell: () => void }) {
  return (
    <div className={card}>
      <Art id={x.asset.id} thumbnail={x.asset.thumbnail} name={x.asset.name} mediaType={x.asset.mediaType}>
        {x.owned > 1 && <span className={cn(glassBadge, "absolute right-2 top-2")}>×{x.owned}</span>}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
      </Art>
      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1 pt-2.5">
        <p className="display truncate text-2xl">{x.asset.name}</p>
        <p className="truncate text-xs text-muted-foreground">{x.asset.creator?.name ?? "Wadzzo"}</p>
        {x.listed > 0 && <p className="marker text-xs text-primary">{x.listed} listed for resale!</p>}
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/item/${x.asset.id}`}>Open</Link>
          </Button>
          <Button size="sm" onClick={onResell}>
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
        <p className="display truncate text-2xl">{x.asset.name}</p>
        <div className="rounded-xl border-2 border-dashed border-foreground/10 px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your price</p>
          <Price tokens={x.listing.price} usd={x.listing.priceUSD} size="sm" />
        </div>
        <div className="mt-auto grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> Price
          </Button>
          <Button size="sm" variant="ghost" disabled={unlist.isPending || sign.busy} onClick={() => void takeBack()}>
            <Undo2 className="size-3.5" /> {sign.busy ? "…" : "Take back"}
          </Button>
        </div>
        {(unlist.error ?? sign.error) && <p className="text-xs text-destructive">{unlist.error?.message ?? sign.error}</p>}
      </div>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change price</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="number" min={0} step="any" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} aria-label={`Price in ${PLATFORM_ASSET.code}`} />
            <Button className="w-full" disabled={price <= 0 || update.isPending} onClick={() => update.mutate({ listingId: x.listing!.id, price })}>
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
        <p className="display truncate text-2xl">{a.name}</p>
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
            <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          )}
        </div>
        <Button asChild size="sm" variant="outline" className="mt-auto">
          <a href={`${env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "")}/stores/${a.id}`} target="_blank" rel="noreferrer">
            Manage <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
