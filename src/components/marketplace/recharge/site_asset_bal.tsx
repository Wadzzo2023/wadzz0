import { Bell, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import MusicControls from "~/components/BackgroundMusic";
import { Button } from "~/components/shadcn/ui/button";
import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

export function isRechargeAbleClient(walletType: WalletType): boolean {
  return (
    walletType == WalletType.facebook ||
    walletType == WalletType.google ||
    walletType == WalletType.emailPass ||
    walletType == WalletType.apple
  );
}

export function SiteAssetBalance() {
  const { setBalance, setActive, active } = useUserStellarAcc();
  const session = useSession();
  const { selectedMenu } = useMode();
  const router = useRouter();
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
  const updateMutation = api.fan.notification.updateNotification.useMutation();
  const updateNotification = () => {
    updateMutation.mutate();
  };
  const { data: notificationCount } =
    api.fan.notification.getUnseenNotificationCount.useQuery();
  const walletType = session.data?.user.walletType ?? WalletType.none;

  const isFBorGoogle = isRechargeAbleClient(walletType);

  if (walletType == WalletType.none) return null;
  if (bal.isLoading) return <div className="skeleton h-10 w-48"></div>;
  if (notificationCount === undefined)
    return <div className="skeleton h-10 w-48"></div>;
  return (
    <div className=" flex items-center justify-center gap-1 ">
      <Link href="/walletBalance" className="">
        <Button className="">
          {/* <div className="flex h-6 w-6 rounded-full  bg-white md:hidden">
            <Image
              alt="logo"
              src="/images/icons/wadzzo.svg"
              className=" mr-2   object-cover"
              width={100}
              height={100}
            />
          </div> */}
          <span className="hidden md:flex">
            {PLATFORM_ASSET.code.toUpperCase()}
            {"  "}
          </span>

          <span className="flex">
            <span className="hidden md:flex">{" : "}</span>
            {bal.data?.platformAssetBal.toFixed(0)}
          </span>
        </Button>

        {/* <Plus className="btn btn-square btn-primary btn-sm -mr-4 " /> */}
      </Link>
      {isFBorGoogle && (
        <Link
          className=" "
          href={"/recharge"}
          // href="/recharge"
        >
          <Button className="">
            <ShoppingCart />
          </Button>
        </Link>
      )}
      <Button
        className=" relative "
        onClick={async () => {
          await router.push("/notification");
          updateNotification();
        }}
      >
        {notificationCount > 0 && (
          <div className="absolute -top-2 left-0 h-4 w-4  rounded-full bg-red-500"></div>
        )}
        <Bell />
      </Button>
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
        return parsedNumber.toExponential(3);
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
