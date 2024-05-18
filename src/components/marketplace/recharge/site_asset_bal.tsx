import Link from "next/link";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import { env } from "~/env";
import { useUserStellarAcc } from "~/lib/state/wallete/userAccBalances";
import { api } from "~/utils/api";

export function SiteAssetBalance() {
  const { isAva, pubkey, walletType } = useConnectWalletStateStore();

  // const bal = api.wallate.acc.getAccountBalance.useQuery();
  const { platformAssetBalance } = useUserStellarAcc();

  // const bal = getAssetBalance();

  const isFBorGoogle =
    walletType == WalletType.facebook ||
    walletType == WalletType.google ||
    walletType == WalletType.emailPass;

  if (!platformAssetBalance) return <div className="skeleton h-10 w-48"></div>;
  if (platformAssetBalance)
    return (
      <Link
        className="btn  btn-secondary border-0  bg-base-content"
        // href={isFBorGoogle ? "/recharge" : "/"}
        href="/recharge"
      >
        <div className="flex flex-col">
          <p className="flex flex-row text-xs md:text-sm">
            <span className="hidden md:flex">{env.NEXT_PUBLIC_SITE} :</span>{" "}
            {platformAssetBalance}
          </p>
        </div>
      </Link>
    );
}

function formatNumber(input?: string): string | null {
  if (input) {
    const parsedNumber = parseFloat(input);

    if (!isNaN(parsedNumber) && Number.isInteger(parsedNumber)) {
      if (Math.abs(parsedNumber) >= 1e6) {
        // If the parsed number is an integer larger than or equal to 1 million,
        // format it in scientific notation
        return parsedNumber.toExponential();
      } else {
        // If the parsed number is an integer smaller than 1 million,
        // return it as is
        return String(parsedNumber);
      }
    } else if (!isNaN(parsedNumber)) {
      // If the parsed number is a float, limit it to two decimal places
      return parsedNumber.toFixed(2);
    } else {
      // If the input is not a valid number, return null or handle accordingly
      return null;
    }
  }
  return null;
}
