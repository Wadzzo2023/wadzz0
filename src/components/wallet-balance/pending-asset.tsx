"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import { Button } from "~/components/shadcn/ui/button";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { type WalletType, clientsign } from "package/connect_wallet";
import toast from "react-hot-toast";
import { cn } from "~/utils/utils";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { Skeleton } from "../shadcn/ui/skeleton";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PendingAssetListProps {
  user: {
    email?: string | null | undefined;
    name?: string | null | undefined;
    id: string;
    image?: string | null | undefined;
    walletType: WalletType;
  };
  setLoading: (loading: boolean) => void;
  loading?: boolean;
}

const PendingAssetList = ({
  user,
  setLoading,
  loading,
}: PendingAssetListProps) => {
  const [buttonIdx, setButtonIdx] = useState<number>();
  const { data, isLoading, isError } =
    api.walletBalance.wallBalance.getPendingAssetList.useQuery();
  // console.log("getPendingAssetList", data);

  const formatAsset = (asset: string) => {
    const parts = asset.split(":");
    if (parts.length > 1) {
      const assetCode = parts[1];
      return `${assetCode?.slice(0, 4)}...${assetCode?.slice(-3)}`;
    }
    return asset.toUpperCase();
  };

  const { needSign } = useNeedSign();

  const AcceptClaimMutation =
    api.walletBalance.wallBalance.claimBalance.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: clientSelect(),
        })
          .then((result) => {

            if (result) {
              toast.success("Claim Balance successful");
            } else {
              toast.error("Claim Balance failed");
            }
          })
          .catch((e) => {
            console.log("error", e);
            toast.error("Adding Claim Balance Operation failed");
          })
          .finally(() => {
            setLoading(false);
          });
      },

      onError(error) {
        console.log("error", error);
        setLoading(false);
      },
    });

  const handleAccept = (balanceId: string, idx: number) => {
    // console.log("balanceId", balanceId);
    setLoading(true);

    setButtonIdx(idx);
    AcceptClaimMutation.mutate({
      balanceId: balanceId,
      signWith: needSign(),
    });
  };

  const DeclineClaimMutation =
    api.walletBalance.wallBalance.declineClaimBalance.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: clientSelect(),
        })
          .then((result) => {
            if (result) {
              toast.success("Decline Claim Balance removed successfully");
            } else {
              toast.error("Decline Claim Balance failed");
            }
          })
          .catch(() => {
            toast.error("Removing Claim Balance Operation failed");
          })
          .finally(() => {
            setLoading(false);
          });
      },

      onError(error) {
        toast.error("Decline Claim Balance failed");
        setLoading(false);
      },
    });

  const handleDecline = (balanceId: string) => {
    // console.log("balanceId", balanceId);
    setLoading(true);
    DeclineClaimMutation.mutate({
      balanceId: balanceId,
      signWith: needSign(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div>Error loading pending assets. Please try again later.</div>;
  }

  return (
    <div>
      <Separator className="my-4" />
      <div className="space-y-4">
        <div className="grid gap-6">
          {!data || data.length === 0 ? (
            <h1>No Pending Assets Available</h1>
          ) : (
            data?.map((balance, idx) => {
              return (
                <div
                  key={`${balance?.asset}-${idx}`}
                  className="flex items-center justify-between space-x-4"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/avatars/05.png" alt="Image" />
                      <AvatarFallback>
                        {balance?.asset.split(":")[0]?.toLowerCase() ===
                          "native"
                          ? "XM"
                          : balance?.asset.toString().slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {balance?.asset.split(":")[0]?.toLowerCase() ===
                          "native"
                          ? "XLM"
                          : balance?.asset.split(":")[0]?.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatAsset(balance?.asset)}
                      </p>
                    </div>
                  </div>
                  <div className="">
                    <h1 className="shrink-0 text-center">{balance?.amount}</h1>
                    <div className="flex items-center justify-between ">
                      <Button
                        onClick={() => handleAccept(balance.id, idx)}
                        size="sm"
                        variant="link"
                        className=""
                        disabled={loading && idx === buttonIdx}
                      >
                        {loading && idx === buttonIdx ? (
                          <>
                            <p> CLAIMING</p>
                            <span className="loading loading-spinner loading-xs ml-1"></span>
                          </>
                        ) : (
                          "CLAIM TOKENS"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingAssetList;
