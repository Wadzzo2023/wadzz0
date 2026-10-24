"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { CheckCircle2, Gift } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { cn } from "~/lib/utils";
import { Avatar } from "~/ui/person";
import { api } from "~/utils/api";
import { Amount } from "~/components/price/amount";

/** Anything in the wallet that can be sent. `issuer` is null for XLM. */
export type SendableAsset = { code: string; issuer: string | null; balance: number; label: string; thumbnail: string | null };

const key = (a: { code: string; issuer: string | null }) => `${a.code}:${a.issuer ?? "native"}`;

/**
 * Send XLM or a token to any Stellar address. A live quote shows the cost and
 * whether it will go through; a token the recipient can't hold yet goes as a
 * gift they accept later.
 */
export function SendDialog({ assets, initial, onClose }: { assets: SendableAsset[]; initial?: SendableAsset; onClose: () => void }) {
  const [selected, setSelected] = useState(initial ? key(initial) : key(assets[0]!));
  const asset = assets.find((a) => key(a) === selected) ?? assets[0]!;
  const [to, setTo] = useState("");
  const [amountText, setAmountText] = useState("");
  const amount = Number(amountText);
  const ready = to.trim().length === 56 && Number.isFinite(amount) && amount > 0;

  const input = useDeferredValue({ code: asset.code, issuer: asset.issuer, to: to.trim(), amount });
  const quote = api.wallet.sendQuote.useQuery(input, { enabled: ready, placeholderData: keepPreviousData });
  const prepare = api.wallet.sendPrepare.useMutation();
  const sign = useSignAndConfirm();
  const utils = api.useUtils();
  const q = ready ? quote.data : undefined;

  const go = async () => {
    const res = await prepare.mutateAsync({ code: asset.code, issuer: asset.issuer, to: to.trim(), amount }).catch(() => null);
    if (res && (await sign.run(res))) await Promise.all([utils.wallet.balances.invalidate(), utils.activity.list.invalidate()]);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Send</DialogTitle>
          <DialogDescription>Send XLM or any token in your wallet to a Stellar address.</DialogDescription>
        </DialogHeader>

        {sign.step === "done" ? (
          <div className="space-y-3 py-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <p className="display text-2xl">
              {prepare.data?.mode === "gift" ? "Gift sent" : "Sent"} <Amount value={amount} currency={asset.code} />
            </p>
            {prepare.data?.mode === "gift" && <p className="text-sm text-muted-foreground">It waits in their Pending gifts until they accept it.</p>}
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asset</p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-foreground/[0.03] p-1 ring-1 ring-foreground/[0.08]" role="radiogroup" aria-label="Asset to send">
                {assets.map((a) => (
                  <button
                    key={key(a)}
                    type="button"
                    role="radio"
                    aria-checked={key(a) === selected}
                    onClick={() => setSelected(key(a))}
                    className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors", key(a) === selected ? "bg-primary/12 ring-1 ring-primary/40" : "hover:bg-foreground/[0.04]")}
                  >
                    {a.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.thumbnail} alt="" className="size-8 rounded-lg object-cover" />
                    ) : (
                      <Avatar name={a.code} className="size-8 text-[10px]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.code}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.label}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{a.balance.toLocaleString("en-US", { maximumFractionDigits: 7 })}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</span>
              <Input value={to} onChange={(e) => setTo(e.target.value.trim().toUpperCase())} placeholder="G… Stellar address" spellCheck={false} autoComplete="off" className="h-11 rounded-xl font-mono text-sm" />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</span>
              <div className="flex items-center gap-2">
                <Input inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" aria-label={`Amount of ${asset.code}`} className="display h-11 rounded-xl text-3xl" />
                <Button type="button" variant="outline" className="h-11" onClick={() => setAmountText(String(asset.balance))}>
                  Max
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: <Amount value={asset.balance} currency={asset.code} />
              </p>
            </div>

            {q && (
              <div className="space-y-2 rounded-xl bg-foreground/[0.04] p-3.5 ring-1 ring-foreground/[0.06]">
                {q.mode === "gift" && (
                  <p className="flex items-start gap-2 text-sm">
                    <Gift className="mt-0.5 size-4 shrink-0 text-primary" /> They can&apos;t hold {asset.code} yet, so it&apos;s sent as a gift they accept from their wallet.
                  </p>
                )}
                {q.mode === "create" && <p className="text-sm">This address isn&apos;t active yet — your XLM opens it.</p>}
                <dl className="space-y-1 text-sm">
                  {q.lines.map((l) => (
                    <div key={l.key} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">
                        {l.label}
                        {l.hint && <span className="block text-xs">{l.hint}</span>}
                      </dt>
                      <dd className="tabular-nums">
                        <Amount value={l.amount} currency={l.currency} />
                      </dd>
                    </div>
                  ))}
                </dl>
                {q.problems.map((p) => (
                  <p key={p} className="rounded-lg tone-danger px-3 py-2 text-sm">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {(prepare.error ?? sign.error) && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{prepare.error?.message ?? sign.error}</p>}
            <Button className="h-11 w-full font-bold" disabled={!q?.ok || quote.isFetching || prepare.isPending || sign.busy} onClick={() => void go()}>
              {sign.step === "signing" ? "Confirm in your wallet…" : sign.step === "confirming" ? "Confirming on Stellar…" : q?.mode === "gift" ? `Send ${asset.code} as a gift` : `Send ${asset.code}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
