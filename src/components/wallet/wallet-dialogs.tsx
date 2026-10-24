"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { CardForm } from "~/components/payment/card-form";
import { Button } from "~/components/shadcn/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { useSignAndConfirm } from "~/hooks/use-sign-and-confirm";
import { cn } from "~/lib/utils";
import { Skeleton } from "~/ui/skeleton";
import { api } from "~/utils/api";
import { Amount, TokenCode } from "~/components/price/amount";

const num = (n: number, max = 2) => n.toLocaleString("en-US", { maximumFractionDigits: max });

function Done({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="space-y-3 py-4 text-center">
      <CheckCircle2 className="mx-auto size-10 text-primary" />
      <p className="display text-2xl">{title}</p>
      <Button variant="outline" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

/** Buy a token pack by card: pick a pack, enter the card, tokens arrive (refunded if delivery fails). */
export function GetTokensDialog({ onClose }: { onClose: () => void }) {
  const packs = api.wallet.packs.useQuery();
  const [usd, setUsd] = useState<number | null>(null);
  const utils = api.useUtils();
  const buy = api.wallet.buyPack.useMutation({ onSuccess: () => void utils.wallet.balances.invalidate() });
  const chosen = packs.data?.packs.find((p) => p.usd === usd) ?? null;
  const code = packs.data?.code ?? "tokens";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Get {code}</DialogTitle>
          <DialogDescription>Pay by card. Tokens land in your wallet right away.</DialogDescription>
        </DialogHeader>
        {buy.isSuccess ? (
          <Done title={`${num(buy.data.tokens)} ${code} added to your wallet`} onClose={onClose} />
        ) : (
          <div className="space-y-4">
            {packs.isLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !packs.data?.packs.length ? (
              <p className="rounded-xl bg-foreground/[0.04] p-4 text-center text-sm text-muted-foreground">Token packs are sold out right now. Please check back soon.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Token pack">
                {packs.data.packs.map((p) => (
                  <button
                    key={p.usd}
                    type="button"
                    role="radio"
                    aria-checked={usd === p.usd}
                    disabled={buy.isPending}
                    onClick={() => setUsd(p.usd)}
                    className={cn(
                      "rounded-xl p-3 text-left ring-1 transition-all",
                      usd === p.usd ? "bg-primary/10 ring-2 ring-primary" : "bg-foreground/[0.03] ring-foreground/[0.08] hover:ring-primary/40",
                    )}
                  >
                    <p className="display flex items-center gap-1.5 text-3xl tabular-nums">
                      {num(p.tokens, 0)}
                      <TokenCode code={code} className="text-2xl" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">${p.usd.toFixed(2)}</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
            {chosen && <CardForm key={chosen.usd} usd={chosen.usd} disabled={buy.isPending} onToken={(t) => buy.mutate({ usd: chosen.usd, ...t })} />}
            {buy.isPending && <p className="text-center text-sm text-muted-foreground">Charging your card and sending tokens…</p>}
            {buy.error && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{buy.error.message}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Swap platform tokens for XLM at the current rate. */
export function SwapDialog({ balance, code, onClose }: { balance: number; code: string; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const tokens = Number(amount);
  const valid = Number.isFinite(tokens) && tokens > 0;
  const quote = api.wallet.swapQuote.useQuery({ tokens }, { enabled: valid });
  const prepare = api.wallet.swapPrepare.useMutation();
  const sign = useSignAndConfirm();
  const utils = api.useUtils();

  const go = async () => {
    const res = await prepare.mutateAsync({ tokens }).catch(() => null);
    if (res && (await sign.run(res))) await utils.wallet.balances.invalidate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Swap {code} for XLM</DialogTitle>
          <DialogDescription>
            You have <Amount value={balance} currency={code} />.
          </DialogDescription>
        </DialogHeader>
        {sign.step === "done" ? (
          <Done title={`Swapped ${num(tokens)} ${code} for ${num(quote.data?.xlm ?? 0, 7)} XLM`} onClose={onClose} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" aria-label={`Amount of ${code}`} className="display h-12 rounded-xl text-3xl" />
                <Button type="button" variant="outline" className="h-12" onClick={() => setAmount(String(balance))}>
                  Max
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-foreground/[0.04] px-4 py-3 ring-1 ring-foreground/[0.06]">
              <span className="text-sm text-muted-foreground">You receive</span>
              <span className="display text-3xl tabular-nums">{valid && quote.data ? `${num(quote.data.xlm, 7)} XLM` : "—"}</span>
            </div>
            {valid && quote.data && !quote.data.ok && <p className="rounded-lg tone-danger px-3 py-2 text-sm">You only have <Amount value={quote.data.balance} currency={code} />.</p>}
            {(prepare.error ?? sign.error) && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{prepare.error?.message ?? sign.error}</p>}
            <Button className="h-11 w-full font-bold" disabled={!quote.data?.ok || prepare.isPending || sign.busy} onClick={() => void go()}>
              {sign.step === "signing" ? "Confirm in your wallet…" : sign.step === "confirming" ? "Confirming on Stellar…" : "Swap"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Your address for receiving XLM, tokens or items from another wallet. */
export function ReceiveDialog({ address, onClose }: { address: string; onClose: () => void }) {
  const copy = () =>
    void navigator.clipboard.writeText(address).then(
      () => toast.success("Address copied"),
      () => toast.error("Couldn't copy the address"),
    );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Receive</DialogTitle>
          <DialogDescription>Share this Stellar address to receive XLM, tokens or items. To receive a token you don&apos;t hold yet, the sender can send it as a gift — it waits under Pending gifts.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="break-all rounded-xl bg-foreground/[0.04] p-4 font-mono text-sm ring-1 ring-foreground/[0.06]">{address}</p>
          <Button className="w-full" onClick={copy}>
            <Copy className="size-4" /> Copy address
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
