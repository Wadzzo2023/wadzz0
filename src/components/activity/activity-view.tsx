"use client";

import type { AssetTxType } from "@prisma/client";
import { format } from "date-fns";
import { Activity, ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { env } from "~/env";
import { formatAmount } from "~/lib/stellar/quote";
import { cn } from "~/lib/utils";
import { EmptyState } from "~/ui/empty-state";
import { PageBody, PageHeader } from "~/ui/page-header";
import { Skeleton } from "~/ui/skeleton";
import { StatusPill, type Tone } from "~/ui/status-pill";
import { api, type RouterOutputs } from "~/utils/api";

type Row = RouterOutputs["activity"]["list"]["items"][number];

const TYPE_LABEL: Record<AssetTxType, string> = {
  ISSUER_SETUP: "Issuer set up",
  STORAGE_SETUP: "Opened resale storage",
  MINT_TO_STORAGE: "Minted to storage",
  PURCHASE: "Bought",
  RESALE_PURCHASE: "Bought (resale)",
  PAGE_ASSET_PURCHASE: "Bought page tokens",
  CLAIM: "Claimed",
  GIFT: "Gift received",
  LIST: "Listed for resale",
  UNLIST: "Took back from resale",
  TOKEN_PURCHASE: "Bought tokens",
  TOKEN_SWAP: "Swapped tokens for XLM",
  GIFT_CLAIM: "Accepted gift",
};

const STATUS: Record<Row["status"], { tone: Tone; label: string }> = {
  SUCCESS: { tone: "success", label: "Completed" },
  PENDING: { tone: "warning", label: "Pending" },
  FAILED: { tone: "danger", label: "Failed" },
};

const ROLES = [
  { id: "all", label: "All" },
  { id: "bought", label: "Bought" },
  { id: "sold", label: "Sold & listed" },
] as const;

const expertTx = (hash: string) => `https://stellar.expert/explorer/${env.NEXT_PUBLIC_STELLAR_PUBNET ? "public" : "testnet"}/tx/${hash}`;

/** My transaction history, with a receipt for each entry. */
export function ActivityView({ me }: { me: string }) {
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("all");
  const q = api.activity.list.useInfiniteQuery({ role, limit: 20 }, { getNextPageParam: (p) => p.nextCursor });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];
  const [open, setOpen] = useState<Row | null>(null);

  return (
    <PageBody className="space-y-5">
      <PageHeader eyebrow="You" title="Activity" description="Every purchase, sale and listing, with exactly what it cost." />
      <div className="flex gap-1.5 overflow-x-auto" role="tablist">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn("h-8 shrink-0 rounded-full border px-3.5 text-sm font-medium", role === r.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
          >
            {r.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !rows.length ? (
        <EmptyState icon={Activity} title="No activity yet" description="Your purchases, sales and listings will appear here." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((r) => {
            const outgoing = r.buyerId === me;
            return (
              <li key={r.id}>
                <button type="button" onClick={() => setOpen(r)} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50">
                  {r.asset?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.asset.thumbnail} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", outgoing ? "tone-neutral" : "tone-success")}>
                      {outgoing ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{TYPE_LABEL[r.type]}{r.asset && ` · ${r.asset.name}`}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.createdAt), "d MMM yyyy, HH:mm")}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    {r.total > 0 && <span className="text-sm font-semibold tabular-nums">{formatAmount(r.total, r.currency)}</span>}
                    <StatusPill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusPill>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {q.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
            {q.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          {open && <Receipt r={open} />}
        </DialogContent>
      </Dialog>
    </PageBody>
  );
}

function Receipt({ r }: { r: Row }) {
  const lines: [string, number][] = [
    [r.type === "LIST" ? "Asking price (each)" : "Price", r.price],
    ["Creator royalty (included)", r.royaltyAmount],
    ["Platform fee", r.platformFee],
    ["Network fee", r.networkFee],
    ["Wallet / storage reserve", r.reserveCost],
  ];
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-hud">{TYPE_LABEL[r.type]}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        {r.asset && (
          <Link href={`/item/${r.asset.id}`} className="flex items-center gap-3 rounded-lg border p-2 hover:bg-accent/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.asset.thumbnail} alt="" className="size-10 rounded-md object-cover" />
            <span className="font-medium">{r.asset.name}</span>
            {r.quantity > 1 && <span className="ml-auto text-muted-foreground">×{r.quantity}</span>}
          </Link>
        )}
        <dl className="space-y-1.5">
          {lines.filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="tabular-nums">{formatAmount(v, r.currency)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t pt-2 font-semibold">
            <dt>Total paid</dt>
            <dd className="tabular-nums">{formatAmount(r.total, r.currency)}</dd>
          </div>
        </dl>
        <dl className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <dt>Status</dt>
            <dd>{STATUS[r.status].label}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Date</dt>
            <dd>{format(new Date(r.createdAt), "d MMM yyyy, HH:mm:ss")}</dd>
          </div>
          {r.method !== "NONE" && (
            <div className="flex justify-between">
              <dt>Paid with</dt>
              <dd>{r.method === "PLATFORM_ASSET" ? r.currency : r.method === "CARD" ? "Card" : "XLM"}</dd>
            </div>
          )}
          {r.paymentRef && (
            <div className="flex justify-between gap-3">
              <dt>Card payment</dt>
              <dd className="truncate font-mono">{r.paymentRef}</dd>
            </div>
          )}
        </dl>
        {r.error && <p className="rounded-lg tone-danger px-3 py-2">{r.error}</p>}
        {r.txHash && r.status === "SUCCESS" && (
          <Button asChild variant="outline" className="w-full">
            <a href={expertTx(r.txHash)} target="_blank" rel="noreferrer">
              View on Stellar <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
      </div>
    </>
  );
}
