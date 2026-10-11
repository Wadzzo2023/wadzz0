"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";

import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** The signed-in wallet's platform-token balance, linking to the wallet. */
export function WalletChip({ className }: { className?: string }) {
  const { signedIn } = useRequireAuth();
  const balances = api.wallet.balances.useQuery(undefined, { enabled: signedIn, staleTime: 30_000 });
  if (!signedIn) return null;
  const b = balances.data;
  return (
    <Link
      href="/wallet"
      className={cn("flex h-10 items-center gap-2.5 rounded-lg border bg-surface-2 px-2.5 transition-colors hover:border-line-bright", className)}
    >
      <Wallet className="size-4 shrink-0 text-primary" />
      {!b ? (
        <span className="skeleton h-4 w-20 rounded" />
      ) : b.active ? (
        <span className="min-w-0 truncate font-hud text-sm font-semibold tabular-nums">
          {fmt.format(b.platform.balance)} <span className="text-xs font-medium text-muted-foreground">{b.platform.code}</span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Activate wallet</span>
      )}
    </Link>
  );
}
