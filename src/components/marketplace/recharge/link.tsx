import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { isRechargeAbleClient } from "./site_asset_bal";
import { Button } from "~/components/shadcn/ui/button";
import { WalletType } from "package/connect_wallet";

export default function RechargeLink() {
  const session = useSession();
  const walletType = session.data?.user.walletType ?? WalletType.none;

  const isFBorGoogle = isRechargeAbleClient(walletType);
  if (isFBorGoogle)
    return (
      <Link className=" " href={isFBorGoogle ? "/recharge" : "/"}>
        <Button className="">Recharge</Button>
      </Link>
    );
}
