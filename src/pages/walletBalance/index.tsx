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

import { Send } from "lucide-react";
import { useModal } from "~/components/hooks/use-modal-store";
import { api } from "~/utils/api";
import TransactionHistory from "~/components/wallet-balance/transactionHistory";

const Wallets = () => {
  const session = useSession();
  const { onOpen } = useModal();
  const { data, isLoading } =
    api.walletBalance.wallBalance.getNativeBalance.useQuery();

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  return (
    <div className=" min-h-screen w-full overflow-hidden p-4 md:p-6">
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
      <div className="grid gap-6 sm:flex sm:flex-col md:grid md:grid-cols-1 lg:grid-cols-3 lg:gap-0">
        {/* Current Balance and Transaction History */}

        <div className="p-2 lg:col-span-2">
          <div className="md:flex md:flex-col md:gap-4">
            {/* Current Balance */}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <h1 className="text-4xl font-bold">{data?.balance} XLM</h1>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <WBRightSideBar />
          </div>
        </div>
        {/* WBRightSideBar */}
        <div className="p-2  lg:col-span-1">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
};
export default Wallets;
