"use client";

import { Layers, Pencil, Play, Repeat2, Store, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MEDIA_META } from "~/components/media/media-meta";
import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { formatAmount } from "~/lib/stellar/quote";
import { EmptyState } from "~/ui/empty-state";
import { ErrorState } from "~/ui/error-state";
import { PageBody, PageHeader } from "~/ui/page-header";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

import { ListDialog, StorageSetupDialog } from "./resale-dialogs";

type Owned = RouterOutputs["collection"]["owned"][number];

/** Everything I own, and what I'm reselling. */
export function CollectionView() {
  const owned = api.collection.owned.useQuery();
  const storage = api.collection.storage.useQuery();
  const [listing, setListing] = useState<Owned | null>(null);
  const [setup, setSetup] = useState<Owned | null>(null);
  const selling = owned.data?.filter((x) => x.listing) ?? [];

  const resell = (x: Owned) => {
    if (storage.data?.exists && storage.data.active) setListing(x);
    else setSetup(x);
  };

  return (
    <PageBody wide className="space-y-5">
      <PageHeader eyebrow="You" title="My collection" description="Items you bought, claimed or were gifted. Open one to play its full content, or resell it to other fans." />
      <Tabs defaultValue="owned">
        <TabsList>
          <TabsTrigger value="owned">Owned {owned.data && `(${owned.data.filter((x) => x.owned > 0).length})`}</TabsTrigger>
          <TabsTrigger value="selling">Selling {owned.data && `(${selling.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="owned" className="mt-4">
          {owned.isLoading ? (
            <GridSkeleton />
          ) : owned.error ? (
            <ErrorState message={owned.error.message} onRetry={() => void owned.refetch()} />
          ) : !owned.data?.some((x) => x.owned > 0) ? (
            <EmptyState icon={Layers} title="No items yet" description="Items you buy, claim or receive as gifts show up here." action={<Button asChild><Link href="/marketplace">Browse the marketplace</Link></Button>} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
              {owned.data.filter((x) => x.owned > 0).map((x) => (
                <OwnedCard key={x.asset.id} x={x} onResell={() => resell(x)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="selling" className="mt-4">
          {owned.isLoading ? (
            <GridSkeleton />
          ) : !selling.length ? (
            <EmptyState icon={Store} title="Nothing listed" description="Resell an item from the Owned tab — it waits in your storage until someone buys it." />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {selling.map((x) => (
                <SellingRow key={x.asset.id} x={x} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

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

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
      ))}
    </div>
  );
}

function OwnedCard({ x, onResell }: { x: Owned; onResell: () => void }) {
  const meta = MEDIA_META[x.asset.mediaType];
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link href={`/item/${x.asset.id}`} className="group relative aspect-square bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={x.asset.thumbnail} alt={x.asset.name} loading="lazy" className="size-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play className="ml-0.5 size-5" />
          </span>
        </span>
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          <meta.icon className="size-3" /> {meta.label}
        </span>
        {x.owned > 1 && <span className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">×{x.owned}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate font-hud text-sm font-semibold">{x.asset.name}</p>
        <p className="truncate text-xs text-muted-foreground">{x.asset.creator?.name ?? "Wadzzo"}</p>
        {x.listed > 0 && <p className="text-xs text-primary">{x.listed} listed for resale</p>}
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/item/${x.asset.id}`}>Open</Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={onResell}>
            <Repeat2 className="size-3.5" /> Resell
          </Button>
        </div>
      </div>
    </div>
  );
}

function SellingRow({ x }: { x: Owned }) {
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
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <Link href={`/item/${x.asset.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={x.asset.thumbnail} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{x.asset.name}</span>
          <span className="text-xs text-muted-foreground">{x.listed} in storage · {formatAmount(x.listing.price, PLATFORM_ASSET.code)} each</span>
        </span>
      </Link>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" /> Price
        </Button>
        <Button size="sm" variant="ghost" disabled={unlist.isPending || sign.busy} onClick={() => void takeBack()}>
          <Undo2 className="size-3.5" /> {sign.busy ? "Taking back…" : "Take back"}
        </Button>
      </div>
      {(unlist.error ?? sign.error) && <p className="text-xs text-destructive">{unlist.error?.message ?? sign.error}</p>}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-hud">Change price</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="number" min={0} step="any" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} aria-label={`Price in ${PLATFORM_ASSET.code}`} />
            <Button className="w-full" disabled={price <= 0 || update.isPending} onClick={() => update.mutate({ listingId: x.listing!.id, price })}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}
