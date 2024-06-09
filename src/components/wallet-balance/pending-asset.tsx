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
  const { data, isLoading } =
    api.walletBalance.wallBalance.getPendingAssetList.useQuery();
  console.log("getPendingAssetList", data);
  const formatAsset = (asset: string) => {
    const parts = asset.split(":");
    if (parts.length > 1) {
      const assetCode = parts[1];
      return `${assetCode?.slice(0, 4)}...${assetCode?.slice(-3)}`;
    }
    return asset.toUpperCase();
  };

  const AcceptClaimMutation =
    api.walletBalance.wallBalance.claimBalance.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: data.test,
        })
          .then((data) => {
            if (data) {
              setLoading(false);
              toast.success("Claim Balance successful");
            } else {
              setLoading(false);
              toast.error("Claim Balance failed");
            }
          })
          .catch(() => {
            setLoading(false);
            toast.error("Adding Claim Balance Operation failed");
          });
      },

      onError(error) {
        setLoading(false);
        toast.error(error.message);
      },
    });

  const handleAccept = (balanceId: string) => {
    console.log("balanceId", balanceId);
    setLoading(true);
    AcceptClaimMutation.mutate({
      balanceId: balanceId,
    });
    setLoading(false);
  };

  const DeclineClaimMutation =
    api.walletBalance.wallBalance.declineClaimBalance.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: data.test,
        })
          .then((data) => {
            if (data) {
              setLoading(false);
              toast.success("Decline Claim Balance removed successful");
            } else {
              setLoading(false);
              toast.error("Decline Claim Balance failed");
            }
          })
          .catch(() => {
            setLoading(false);
            toast.error("Removing Claim Balance Operation failed");
          });
      },

      onError(error) {
        setLoading(false);
        toast.error(error.message);
      },
    });

  const handleDecline = (balanceId: string) => {
    console.log("balanceId", balanceId);
    setLoading(true);
    DeclineClaimMutation.mutate({
      balanceId: balanceId,
    });
  };
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <Separator className="my-4" />
      <div className="space-y-4">
        <div className="grid gap-6">
          {!data || data.length === 0 ? (
            <h1>No Pending Assets Available</h1>
          ) : (
            data?.map((balance, idx) => (
              <div
                key={`${balance?.asset}-${idx}`}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/avatars/05.png" alt="Image" />
                    <AvatarFallback>
                      {balance?.asset.split(":")[0]?.toLowerCase() === "native"
                        ? "XM"
                        : balance?.asset.toString().slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {balance?.asset.split(":")[0]?.toLowerCase() === "native"
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
                      onClick={() => handleAccept(balance.id)}
                      size="sm"
                      variant="link"
                      className={cn(
                        `${balance?.isExpired && balance.claimants[0]?.destination !== user?.id ? "" : "hidden"}`,
                      )}
                      disabled={loading}
                    >
                      Claim
                    </Button>
                    <Button
                      onClick={() => handleDecline(balance.id)}
                      size="sm"
                      variant="link"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingAssetList;
