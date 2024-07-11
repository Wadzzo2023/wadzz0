import { Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { Button } from "~/components/shadcn/ui/button";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

export function SiteAssetBalance() {
  const { setBalance, setActive, active } = useUserStellarAcc();
  const session = useSession();

  const bal = api.wallate.acc.getAccountBalance.useQuery(undefined, {
    onSuccess: (data) => {
      const { balances, platformAssetBal, xlm } = data;
      setBalance(balances);
      setActive(true);
    },
    onError: (error) => {
      // toast.error(error.message);
      setActive(false);
    },
  });

  const walletType = session.data?.user.walletType ?? WalletType.none;

  const isFBorGoogle =
    walletType == WalletType.facebook ||
    walletType == WalletType.google ||
    walletType == WalletType.emailPass ||
    walletType == WalletType.apple;

  if (walletType == WalletType.none) return null;
  if (bal.isLoading) return <div className="skeleton h-10 w-48"></div>;
  // if (!bal.isSuccess)
  //   return (
  //     <div className="flex h-10 w-48 items-center justify-center rounded-2xl bg-error text-white">
  //       Pubkey Not Active
  //     </div>
  //   );
  return (
    <div className=" flex items-center justify-center gap-1 ">
      <Link href="/walletBalance" className="">
        <Button className="">
          {PLATFROM_ASSET.code.toUpperCase() + " : "}
          {formatNumber(bal.data?.platformAssetBal?.toString())}
        </Button>

        {/* <Plus className="btn btn-square btn-primary btn-sm -mr-4 " /> */}
      </Link>

      <Link
        className=" "
        href={isFBorGoogle ? "/recharge" : "/"}
        // href="/recharge"
      >
        <Button className="">
          {/* <svg
            className="me-2 h-3.5 w-3.5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 18 18"
          >
            <path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z" />
          </svg> */}
          <ShoppingCart />
        </Button>
      </Link>
    </div>
  );
}

export function formatNumber(input?: string): string | null {
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
