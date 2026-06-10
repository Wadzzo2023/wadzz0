import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { isRechargeAbleClient } from "./site_asset_bal";
import { Button } from "~/components/shadcn/ui/button";
import { WalletType } from "package/connect_wallet";
import { Wallet } from "lucide-react";

export default function RechargeLink() {
  const session = useSession();
  const walletType = session.data?.user.walletType ?? WalletType.none;

  const isFBorGoogle = isRechargeAbleClient(walletType);

  if (!isFBorGoogle) return null;

  return (
    <Link href="/recharge" className="block w-full sm:w-auto">
      <Button variant="outline" className="w-full sm:w-auto gap-2 bg-transparent">
        <Wallet className="h-4 w-4" />
        Recharge
      </Button>
    </Link>
  );
}