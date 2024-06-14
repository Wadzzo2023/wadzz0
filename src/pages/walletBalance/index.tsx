import { Input } from "~/components/shadcn/ui/input";
import { Button } from "~/components/shadcn/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";

import WBRightSideBar from "~/components/wallet-balance/wb-right-sidebar";
import { useSession } from "next-auth/react";

import { HandIcon, Send } from "lucide-react";
import { useModal } from "~/components/hooks/use-modal-store";
import { api } from "~/utils/api";
import TransactionHistory from "~/components/wallet-balance/transactionHistory";
import QRCode from "react-qr-code";
import CopyToClip from "~/components/wallete/copy_to_Clip";
import {} from "lucide-react";
import { ViewfinderCircleIcon } from "@heroicons/react/24/solid";
import Loading from "~/components/wallete/loading";
import { clientSelect } from "~/lib/stellar/fan/utils";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
const Wallets = () => {
  const session = useSession();
  const { onOpen } = useModal();
  const { data, isLoading } =
    api.walletBalance.wallBalance.getNativeBalance.useQuery();

  if (!session.data) {
    return <div>Session not found</div>;
  }
  if (isLoading) {
    const x = clientSelect();
    let text = "";
    if (x === true) {
      text = "Fetching Data From Test Net";
    } else {
      text = "Fetching Data From Main Net";
    }
    return (
      <div className="">
        <Loading text={text} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center  md:p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Your account has not been funded yet!!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              RECEIVE ASSETS TO YOUR ACCOUNT
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="flex aspect-square w-full max-w-[300px] items-center justify-center rounded-lg bg-black dark:bg-white">
              <QRCode
                size={256}
                style={{
                  borderRadius: "10px",
                }}
                value={session?.data?.user?.id}
                viewBox={`0 0 256 256`}
              />
            </div>
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              Point your camera at a QR code to scan it.
            </div>
          </div>
          <div className="space-y-4 rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Scanned Content
            </h2>
            <div className="text-gray-600 dark:text-gray-400">
              <h6 className="p-1 text-[10px] md:text-xs">
                {session?.data?.user?.id}
              </h6>
              <CopyToClip text={session?.data?.user?.id} collapse={5} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" min-h-screen overflow-hidden p-1  ">
      <div className="flex items-center justify-between gap-4 sm:justify-between md:justify-between lg:justify-end">
        <Button
          variant={"default"}
          className="m-3 p-3 font-bold"
          onClick={() => onOpen("receive assets")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="mr-2 h-6 w-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          RECEIVE ASSET
        </Button>
        <Button
          variant="default"
          className="m-3 p-3 font-bold"
          onClick={() => onOpen("send assets")}
        >
          <Send size={15} className="mr-2 " /> SEND ASSETS
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <Card>
              <CardContent className="m-2 p-2">
                <div className="flex flex-col items-center justify-center md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col items-center justify-center md:items-start">
                    <CardTitle>Current Balance</CardTitle>
                    <h1 className="text-4xl font-bold">{data?.balance} XLM</h1>
                  </div>
                </div>
              </CardContent>
            </Card>

            <WBRightSideBar />
          </div>
        </div>

        <div className="lg:col-span-1">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
};
export default Wallets;
