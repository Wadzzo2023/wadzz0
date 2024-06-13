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
const Wallets = () => {
  const session = useSession();
  const { onOpen } = useModal();
  const { data, isLoading } =
    api.walletBalance.wallBalance.getNativeBalance.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!data) {
    return <div>No Data Available To Show</div>;
  }
  if (!session?.data?.user?.id) {
    return <div>Public Key not found</div>;
  }

  return (
    <div className=" min-h-screen overflow-hidden p-1  md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-xl">Wallet Balance</h1>
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
                  <Button
                    variant={"default"}
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
