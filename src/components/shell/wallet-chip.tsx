"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";

import { useRequireAuth } from "~/hooks/use-require-auth";
import { useCurrency } from "~/hooks/use-currency";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const short = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const usdFull = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdShort = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

/** The signed-in wallet's platform-token balance, linking to the wallet. `compact` abbreviates (1.2K). */
export function WalletChip({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { signedIn } = useRequireAuth();
  const balances = api.wallet.balances.useQuery(undefined, { enabled: signedIn, staleTime: 30_000 });
  const { currency } = useCurrency();
  if (!signedIn) return null;
  const b = balances.data;
  return (
    <Link
      href="/wallet"
      title={b?.active ? `${full.format(b.platform.balance)} ${b.platform.code}` : "Wallet"}
      className={cn("flex h-10 items-center gap-2 rounded-lg border bg-surface-2 px-2.5 transition-colors hover:border-line-bright", className)}
    >
      <Wallet className="size-4 shrink-0 text-primary" />
      {!b ? (
        <span className="skeleton h-4 w-12 rounded" />
      ) : b.active && currency === "USD" && b.platform.usd != null ? (
        <span className="min-w-0 truncate font-hud text-sm font-semibold tabular-nums">{(compact ? usdShort : usdFull).format(b.platform.usd)}</span>
      ) : b.active ? (
        <span className="min-w-0 truncate font-hud text-sm font-semibold tabular-nums">
          {(compact ? short : full).format(b.platform.balance)}
          <span className={cn("ml-1 text-xs font-medium text-muted-foreground", compact && "hidden lg:inline")}>{b.platform.code}</span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Activate</span>
      )}
    </Link>
  );
}
