import { Input } from "~/components/shadcn/ui/input";
import { Button } from "~/components/shadcn/ui/button";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";

import WBRightSideBar from "~/components/wallet-balance/wb-right-sidebar";
import { useSession } from "next-auth/react";

import { HandIcon, Plus, QrCode, Send } from "lucide-react";
import { useModal } from "~/components/hooks/use-modal-store";
import { api } from "~/utils/api";
import TransactionHistory from "~/components/wallet-balance/transactionHistory";
import QRCode from "react-qr-code";
import CopyToClip from "~/components/wallete/copy_to_Clip";
import {} from "lucide-react";
import { ViewfinderCircleIcon } from "@heroicons/react/24/solid";
import Loading from "~/components/wallete/loading";
import { clientSelect } from "~/lib/stellar/fan/utils";
import useNeedSign from "~/lib/hook";
import { useCallback, useEffect, useState } from "react";
import {
  checkStellarAccountActivity,
  clientsign,
} from "package/connect_wallet/src/lib/stellar/utils";

import toast from "react-hot-toast";

const Wallets = () => {
  const session = useSession();
  const { onOpen } = useModal();
  const { needSign } = useNeedSign();
  const [isAccountActivate, setAccountActivate] = useState(false);
  const [isAccountActivateLoading, setAccountActivateLoading] = useState(false);

  const [isLoading, setLoading] = useState(false);

  async function checkAccountActivity(publicKey: string) {
    setAccountActivateLoading(true);
    const isActive = await checkStellarAccountActivity(publicKey);
    console.log("isActive", isActive);
    setAccountActivate(isActive);
    setAccountActivateLoading(false);
  }

  const {
    data: hasTrustLineOnPlatformAsset,
    isLoading: checkingPlatformLoading,
  } = api.walletBalance.wallBalance.checkingPlatformTrustLine.useQuery();

  const { data: platformBalance, isLoading: getPlatformLoading } =
    api.walletBalance.wallBalance.getPlatformAssetBalance.useQuery(undefined, {
      enabled: hasTrustLineOnPlatformAsset,
    });

  const checkStatus = useCallback(async () => {
    const user = session.data?.user;
    if (user) {
      console.log("user", user);
      await checkAccountActivity(user.id);
    }
  }, [session]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus, session]);
  const AddTrustMutation =
    api.walletBalance.wallBalance.addTrustLine.useMutation({
      onSuccess: async (data) => {
        try {
          const clientResponse = await clientsign({
            walletType: session?.data?.user?.walletType,
            presignedxdr: data.xdr,
            pubkey: data.pubKey,
            test: clientSelect(),
          });

          if (clientResponse) {
            toast.success("Added trustline successfully");
            try {
              await api
                .useUtils()
                .walletBalance.wallBalance.getWalletsBalance.refetch();
            } catch (refetchError) {
              console.log("Error refetching balance", refetchError);
            }
          } else {
            toast.error("No Data Found at TrustLine Operation");
          }
        } catch (error) {
          if (error instanceof Error) {
            toast.error(`Error: ${error.message}`);
          } else {
            toast.error("An unknown error occurred.");
          }
          console.log("Error", error);
        } finally {
          setLoading(false);
        }
      },
      onError: (error) => {
        setLoading(false);
        toast.error(error.message);
      },
    });

  const handleSubmit = async () => {
    setLoading(true);
    AddTrustMutation.mutate({
      asset_code: PLATFROM_ASSET.code,
      asset_issuer: PLATFROM_ASSET.issuer,
      signWith: needSign(),
    });
  };

  if (!session.data) {
    return <div>Session not found</div>;
  }
  if (isAccountActivateLoading) {
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
  if (checkingPlatformLoading || getPlatformLoading) {
    return <Loading text="Fetching Data" />;
  }

  if (!isAccountActivate) {
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
    <div className=" min-h-screen overflow-hidden p-1">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <Card>
              <CardContent className="m-2 p-2">
                <div className="flex flex-col items-center justify-center md:flex-row md:items-center md:justify-between ">
                  <div className="flex flex-col items-center justify-center md:items-start">
                    {hasTrustLineOnPlatformAsset ? (
                      <>
                        <CardTitle className="text-xl font-bold xl:text-2xl">
                          Current Balance
                        </CardTitle>
                        <h1 className="text-xl font-bold xl:text-3xl">
                          {platformBalance?.toString() === "0.0000000"
                            ? "0"
                            : platformBalance?.toString()}{" "}
                          <span className="text-lg">Wadzzo</span>
                        </h1>
                      </>
                    ) : (
                      <>
                        <h1 className="text-xl text-red-500 ">
                          You haven{"'"}t trust to Wadzzo yet !
                          <br />
                          <button
                            onClick={handleSubmit}
                            className="text-sm underline"
                          >
                            CLICK HERE TO TRUST
                          </button>
                        </h1>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1 md:items-end lg:justify-end">
                    <Button
                      size="sm"
                      variant={"default"}
                      className="md:text-md  text-xs md:m-3 md:p-3 md:font-bold"
                      onClick={() => onOpen("receive assets")}
                    >
                      <QrCode size={14} className="mr-1 md:mr-2" />
                      RECEIVE ASSET
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="md:text-md text-xs md:m-3 md:p-3 md:font-bold"
                      onClick={() => onOpen("send assets")}
                    >
                      <Send size={14} className="mr-1 md:mr-2 " /> SEND ASSETS
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className=" md:text-md text-xs md:m-3 md:p-3 md:font-bold"
                      onClick={() => onOpen("add assets")}
                    >
                      <Plus size={14} className="mr-1 md:mr-2 " /> ADD ASSETS
                    </Button>
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
