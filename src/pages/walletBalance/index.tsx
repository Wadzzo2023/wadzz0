import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

import { useSession } from "next-auth/react";
import WBRightSideBar from "~/components/wallet-balance/wb-right-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";

import { QrCode, Send } from "lucide-react";
import {
  checkStellarAccountActivity,
  clientsign,
} from "package/connect_wallet/src/lib/stellar/utils";
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useModal } from "~/lib/state/play/use-modal-store";
import TransactionHistory from "~/components/wallet-balance/transactionHistory";
import CopyToClip from "~/components/wallete/copy_to_Clip";
import Loading from "~/components/wallete/loading";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { getCookie } from "cookies-next";

const Wallets = () => {
  const session = useSession();
  const { onOpen } = useModal();
  const { needSign } = useNeedSign();
  const [isAccountActivate, setAccountActivate] = useState(false);
  const [isAccountActivateLoading, setAccountActivateLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");
  const router = useRouter();

  async function checkAccountActivity(publicKey: string) {
    setAccountActivateLoading(true);
    const isActive = await checkStellarAccountActivity(publicKey);
    // console.log("isActive", isActive);
    setAccountActivate(isActive);
    setAccountActivateLoading(false);
  }

  const {
    data: hasTrustLineOnPlatformAsset,
    isLoading: checkingPlatformLoading,
  } = api.walletBalance.wallBalance.checkingPlatformTrustLine.useQuery(
    undefined,
    {
      enabled: !!session.data?.user,
      refetchOnWindowFocus: false,
    },
  );

  const { data: platformBalance, isLoading: getPlatformLoading } =
    api.walletBalance.wallBalance.getPlatformAssetBalance.useQuery(undefined, {
      enabled: hasTrustLineOnPlatformAsset,
      refetchOnWindowFocus: false,
    });
  useEffect(() => {
    if (router.query.id) {
      onOpen("send assets"); // Update state when id is available
    }
  }, [router.query.id, onOpen]);

  const checkStatus = useCallback(async () => {
    const user = session.data?.user;
    if (user) {
      // console.log("user", user);
      await checkAccountActivity(user.id);
    }
  }, [session.data?.user]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern") {
      setLayoutMode("modern");
    } else {
      setLayoutMode("legacy");
    }
  }, []);

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
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  if (!session.data) {
    return <div>Session not found</div>;
  }
  if (isAccountActivateLoading) {
    return (
      <div className="">
        <Loading />
      </div>
    );
  }
  if (checkingPlatformLoading || getPlatformLoading) {
    return <Loading />;
  }
  const url = `https://app.wadzzo.com${router.pathname}?id=${session?.data?.user?.id}`;

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
                value={url}
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

  if (layoutMode === "legacy") {
    return (
      <div className=" p-4 space-y-6">
        <Card className="bg-gradient-to-r  from-[#39BD2B] to-blue-400 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                {hasTrustLineOnPlatformAsset ? (
                  <>
                    <h2 className="text-2xl font-semibold mb-2">Current Balance</h2>
                    <p className="text-4xl font-bold">
                      {platformBalance?.toString() === "0.0000000" ? "0" : platformBalance?.toString()}
                      <span className="text-2xl ml-2">{PLATFORM_ASSET.code}</span>
                    </p>
                  </>
                ) : (
                  <div className="text-center md:text-left">
                    <p className="text-xl mb-2">You haven{"'t"} added trust for {PLATFORM_ASSET.code} yet!</p>
                    <Button
                      onClick={() => AddTrustMutation.mutate({
                        asset_code: PLATFORM_ASSET.code,
                        asset_issuer: PLATFORM_ASSET.issuer,
                        signWith: needSign(),
                      })}
                      disabled={AddTrustMutation.isLoading}
                      variant="secondary"
                    >
                      {AddTrustMutation.isLoading ? "Adding Trustline..." : "Add Trustline"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onOpen("receive assets")}>
                  <QrCode size={18} className="mr-2" />
                  Receive
                </Button>
                <Button variant="secondary" onClick={() => onOpen("send assets")}>
                  <Send size={18} className="mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="hidden md:grid  md:grid-cols-2 gap-6 ">
          <Card className="md:col-span-1 h-[calc(100vh-30vh)]">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="">
              <TransactionHistory />
            </CardContent>
          </Card>
          <Card className="h-[calc(100vh-30vh)]">
            <CardHeader>
              <CardTitle>My Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <WBRightSideBar />
            </CardContent>
          </Card>
        </div>
        <div className="md:hidden">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Transaction History</TabsTrigger>
              <TabsTrigger value="assets">My Assets</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <Card className="h-[calc(100vh-40vh)]">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionHistory />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="assets">
              <Card className="h-[calc(100vh-40vh)]">
                <CardHeader>
                  <CardTitle>My Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <WBRightSideBar />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative flex min-h-[72vh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1b0e7a] via-[#5a2ac9] to-[#c69a86] px-4 pb-28 pt-14 text-white">
        <div className="mx-auto w-full max-w-[85vw]">
        {hasTrustLineOnPlatformAsset ? (
          <div className="px-2 text-center">
            <p className="text-lg font-medium text-white/75">Current Balance</p>
            <p className="mt-2 max-w-full break-all text-[clamp(2rem,10vw,3.75rem)] font-semibold leading-[1.05] tracking-tight sm:break-normal">
              {platformBalance?.toString() === "0.0000000" ? "0" : platformBalance?.toString()}
            </p>
            <p className="mt-3 text-xl font-medium text-white/85">{PLATFORM_ASSET.code}</p>
          </div>
        ) : (
          <div className="max-w-xl text-center">
            <p className="text-lg font-medium text-white/85">
              You haven{"'t"} added trust for {PLATFORM_ASSET.code} yet.
            </p>
            <Button
              onClick={() => AddTrustMutation.mutate({
                asset_code: PLATFORM_ASSET.code,
                asset_issuer: PLATFORM_ASSET.issuer,
                signWith: needSign(),
              })}
              disabled={AddTrustMutation.isLoading}
              className="mt-4 h-10 rounded-full bg-white/95 px-5 text-sm font-semibold text-[#1b0e7a] hover:bg-white"
            >
              {AddTrustMutation.isLoading ? "Adding Trustline..." : "Add Trustline"}
            </Button>
          </div>
        )}

        <div className="absolute bottom-10 left-1/2 flex w-full max-w-md -translate-x-1/2 gap-3 px-4">
          <Button
            variant="outline"
            onClick={() => onOpen("receive assets")}
            className="h-11 flex-1 rounded-full border-white/30 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
          >
            <QrCode size={18} className="mr-2" />
            Receive
          </Button>
          <Button
            onClick={() => onOpen("send assets")}
            className="h-11 flex-1 rounded-full bg-white text-[#1b0e7a] hover:bg-white/90"
          >
            <Send size={18} className="mr-2" />
            Send
          </Button>
        </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[85vw] pb-8 pt-6">
        <div className="rounded-3xl bg-white/92 p-4 shadow-[0_14px_44px_-30px_rgba(15,23,42,0.35)] backdrop-blur-md md:p-6">
      <div className="hidden md:grid  md:grid-cols-2 gap-6 ">
        <Card className="md:col-span-1 h-[calc(100vh-30vh)] border border-black/10 bg-white/70 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="">
            <TransactionHistory />
          </CardContent>
        </Card>
        <Card className="h-[calc(100vh-30vh)] border border-black/10 bg-white/70 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle>My Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <WBRightSideBar />
          </CardContent>
        </Card>
      </div>
      <div className="md:hidden">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border border-black/10 bg-white/80 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <TabsTrigger value="history">Transaction History</TabsTrigger>
            <TabsTrigger value="assets">My Assets</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <Card className="h-[calc(100vh-40vh)] border border-black/10 bg-white/70 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionHistory />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assets">
            <Card className="h-[calc(100vh-40vh)] border border-black/10 bg-white/70 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.3)] backdrop-blur-xl">
              <CardHeader>
                <CardTitle>My Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <WBRightSideBar />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
      </section>

    </div>
  );
};
export default Wallets;
