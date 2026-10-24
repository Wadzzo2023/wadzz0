"use client";

import { Archive, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { CostBreakdown, ProblemList } from "~/components/payment/cost-breakdown";
import { MethodPicker } from "~/components/payment/method-picker";
import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { Skeleton } from "~/ui/skeleton";
import { api } from "~/utils/api";

type PayIn = "PLATFORM_ASSET" | "XLM";

function SignButton({ step, idle, disabled, onClick }: { step: string; idle: string; disabled?: boolean; onClick: () => void }) {
  return (
    <Button className="w-full" size="lg" disabled={Boolean(disabled) || step === "signing" || step === "confirming"} onClick={onClick}>
      {step === "signing" ? "Confirm in your wallet…" : step === "confirming" ? "Confirming on Stellar…" : idle}
    </Button>
  );
}

/**
 * Reselling needs a storage account that holds the copies while they're
 * listed. It's opened once; the seller pays its deposit.
 */
export function StorageSetupDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [payIn, setPayIn] = useState<PayIn>("PLATFORM_ASSET");
  const quote = api.collection.storageQuote.useQuery({ payIn }, { enabled: open });
  const prepare = api.collection.storagePrepare.useMutation();
  const sign = useSignAndConfirm();

  const go = async () => {
    const res = await prepare.mutateAsync({ payIn }).catch(() => null);
    if (res?.ok && (await sign.run({ txId: res.txId, xdr: res.xdr }))) onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display flex items-center gap-2 text-2xl">
            <Archive className="size-5 text-primary" /> Open your resale storage
          </DialogTitle>
          <DialogDescription>A one-time step. Items you list wait here until someone buys them; you can take them back anytime.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <MethodPicker value={payIn} onChange={(m) => setPayIn(m as PayIn)} methods={["PLATFORM_ASSET", "XLM"]} />
          {quote.data ? (
            <>
              <CostBreakdown lines={quote.data.lines} total={quote.data.total} currency={quote.data.currency} balance={quote.data.balance} />
              <ProblemList problems={quote.data.problems} />
            </>
          ) : (
            <Skeleton className="h-36 rounded-xl" />
          )}
          {(prepare.error ?? sign.error) && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{prepare.error?.message ?? sign.error}</p>}
          <SignButton step={sign.step} idle="Open storage" disabled={!quote.data?.ok || prepare.isPending} onClick={() => void go()} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Put copies up for sale: how many, at what price, and what listing costs. */
export function ListDialog({
  item,
  open,
  onOpenChange,
}: {
  item: { assetId: number; name: string; owned: number; royaltyPercent: number; currentPrice?: number };
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [copies, setCopies] = useState(1);
  const [price, setPrice] = useState(item.currentPrice ?? 0);
  const [payIn, setPayIn] = useState<PayIn>("PLATFORM_ASSET");
  const quote = api.collection.listQuote.useQuery({ assetId: item.assetId, copies, payIn }, { enabled: open && copies >= 1 });
  const prepare = api.collection.listPrepare.useMutation();
  const sign = useSignAndConfirm();
  const utils = api.useUtils();
  const youGet = Math.max(0, price * (1 - item.royaltyPercent / 100));

  const go = async () => {
    const res = await prepare.mutateAsync({ assetId: item.assetId, copies, price, payIn }).catch(() => null);
    if (res?.ok && (await sign.run({ txId: res.txId, xdr: res.xdr }))) await utils.collection.owned.invalidate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange(o), !o && sign.reset())}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Resell “{item.name}”</DialogTitle>
          <DialogDescription>The copies move to your storage and go on the marketplace once the transaction lands.</DialogDescription>
        </DialogHeader>
        {sign.step === "done" ? (
          <div className="space-y-3 py-4 text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary" />
            <p className="display text-2xl">Listed!</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="copies">Copies (you own {item.owned})</Label>
                <Input id="copies" type="number" min={1} max={item.owned} value={copies} onChange={(e) => setCopies(Math.min(item.owned, Math.max(1, Math.floor(Number(e.target.value)))))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price each ({PLATFORM_ASSET.code})</Label>
                <Input id="price" type="number" min={0} step="any" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
            </div>
            {price > 0 && (
              <p className="text-xs text-muted-foreground">
                You receive {youGet.toLocaleString(undefined, { maximumFractionDigits: 2 })} {PLATFORM_ASSET.code} per sale
                {item.royaltyPercent > 0 && ` (the creator earns a ${item.royaltyPercent}% royalty)`}. Buyers pay the platform fee on top.
              </p>
            )}
            <div className="space-y-2">
              <p className="label-caps">Pay listing costs with</p>
              <MethodPicker value={payIn} onChange={(m) => setPayIn(m as PayIn)} methods={["PLATFORM_ASSET", "XLM"]} />
            </div>
            {quote.data ? (
              <>
                <CostBreakdown lines={quote.data.lines} total={quote.data.total} currency={quote.data.currency} balance={quote.data.balance} />
                <ProblemList problems={quote.data.problems} />
              </>
            ) : (
              <Skeleton className="h-32 rounded-xl" />
            )}
            {(prepare.error ?? sign.error) && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{prepare.error?.message ?? sign.error}</p>}
            <SignButton step={sign.step} idle="List for sale" disabled={!quote.data?.ok || price <= 0 || prepare.isPending} onClick={() => void go()} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
