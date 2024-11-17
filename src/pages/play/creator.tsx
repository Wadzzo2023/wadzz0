import {
  FollowBrand,
  getAllBrands,
  GetXDR4Follow,
  HasTrustOnPageAsset,
  UnFollowBrand,
} from "~/lib/play";
import { BrandMode, useAccountAction } from "~/lib/state/play/useAccountAction";
// import LoadingScreen from "@/components/Loading";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { Loader2, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { clientsign, WalletType } from "package/connect_wallet";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { Input } from "~/components/shadcn/ui/input";
import { Switch } from "~/components/shadcn/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import Loading from "~/components/wallete/loading";
import { clientSelect } from "~/lib/stellar/fan/utils";

type Brand = {
  id: string;
  first_name: string;
  followed_by_current_user: boolean;
  last_name: string;
  logo: string;
};

export default function CreatorPage() {
  //   const { user, isAuthenticated } = useAuth();
  const session = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [unfollowLoadingId, setUnfollowLoadingId] = useState<string | null>(
    null,
  );
  const [submitLoading, setSubmitLoading] = useState(false);

  const router = useRouter();

  const connectedWalletType = session.data?.user.walletType ?? WalletType.none;

  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["AllBrands"],
    queryFn: getAllBrands,
  });

  const followMutation = useMutation({
    mutationFn: async ({
      brand_id,
      wallate,
    }: {
      brand_id: string;
      wallate: WalletType;
    }) => {
      setFollowLoadingId(brand_id);
      console.log("brand_id", brand_id);

      const hasTrust = await HasTrustOnPageAsset({ brand_id });

      if (!hasTrust) {
        const xdr = await GetXDR4Follow({ brand_id, wallate });
        if (!xdr) {
          toast.error("Failed to get XDR");
          return;
        }
        setSubmitLoading(true);
        toast.promise(
          clientsign({
            presignedxdr: xdr,
            pubkey: session.data?.user.id,
            walletType: wallate,
            test: clientSelect(),
          })
            .then(async (res) => {
              if (res) {
                await FollowBrand({ brand_id });
              } else {
                toast.error("Transaction Failed");
              }
            })
            .catch((e) => console.log(e))
            .finally(() => setSubmitLoading(false)),
          {
            loading: "Signing Transaction",
            success: "Signed Transaction Successfully",
            error: "Signing Transaction Failed",
          },
        );
      } else {
        return await FollowBrand({ brand_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["AllBrands"],
      });
      setFollowLoadingId(null);
    },
    onError: (error) => {
      console.error("Error following brand:", error);
      setFollowLoadingId(null);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ brand_id }: { brand_id: string }) => {
      setUnfollowLoadingId(brand_id);
      return await UnFollowBrand({ brand_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["AllBrands"],
      });
      setUnfollowLoadingId(null);
    },
    onError: (error) => {
      console.error("Error unfollowing brand:", error);
      setUnfollowLoadingId(null);
    },
  });

  const toggleFollow = (brandId: string, isAlreadyFollowed: boolean) => {
    if (isAlreadyFollowed) {
      setUnfollowLoadingId(brandId);
      unfollowMutation.mutate({ brand_id: brandId });
    } else {
      setFollowLoadingId(brandId);
      followMutation.mutate({
        brand_id: brandId,
        wallate: connectedWalletType,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (data) {
      setBrands(data.users);
    }
  }, [data]);

  useEffect(() => {
    queryClient.refetchQueries({
      queryKey: ["MapsAllPins"],
    });
  }, [accountActionData.brandMode]);

  const filteredBrands = brands?.filter((brand) => {
    const matchesSearch = brand.first_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeTab === "followed") {
      return matchesSearch && brand.followed_by_current_user;
    }
    return matchesSearch;
  });

  if (isLoading) return <Loading />;
  if (error)
    return <div className="text-center text-red-500">Error loading brands</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between rounded-lg bg-[#FF5A5F] p-4 text-white">
        <h1 className="text-2xl font-bold">Brands</h1>
        <div className="flex items-center space-x-2 rounded-full bg-white p-1">
          <span
            className={`text-sm ${
              accountActionData.brandMode !== BrandMode.FOLLOW
                ? "font-bold text-[#FF5A5F]"
                : "text-gray-500"
            }`}
          >
            General
          </span>
          <Switch
            checked={accountActionData.brandMode === BrandMode.FOLLOW}
            onCheckedChange={(value) =>
              setAccountActionData({
                ...accountActionData,
                brandMode: value ? BrandMode.FOLLOW : BrandMode.GENERAL,
              })
            }
          />
          <span
            className={`text-sm ${
              accountActionData.brandMode === BrandMode.FOLLOW
                ? "font-bold text-[#FF5A5F]"
                : "text-gray-500"
            }`}
          >
            Follow
          </span>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
        <Input
          type="search"
          placeholder="Search brands"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Brands</TabsTrigger>
          <TabsTrigger value="followed">Followed Brands</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredBrands?.length ? (
        <div className="h-[600px] space-y-4 overflow-y-auto ">
          {filteredBrands.map((brand: Brand) => (
            <Card key={brand.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={brand.logo}
                    alt={brand.first_name}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="font-semibold">{brand.first_name}</span>
                </div>
                <Button
                  variant={
                    brand.followed_by_current_user ? "outline" : "default"
                  }
                  onClick={() =>
                    toggleFollow(brand.id, brand.followed_by_current_user)
                  }
                  disabled={
                    followLoadingId === brand.id ||
                    unfollowLoadingId === brand.id
                  }
                >
                  {followLoadingId === brand.id ||
                  unfollowLoadingId === brand.id ? (
                    <Loader2 className="animate-spin" />
                  ) : brand.followed_by_current_user ? (
                    "Unfollow"
                  ) : (
                    "Follow"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
          {filteredBrands.map((brand: Brand) => (
            <Card key={brand.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={brand.logo}
                    alt={brand.first_name}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="font-semibold">{brand.first_name}</span>
                </div>
                <Button
                  variant={
                    brand.followed_by_current_user ? "outline" : "default"
                  }
                  onClick={() =>
                    toggleFollow(brand.id, brand.followed_by_current_user)
                  }
                  disabled={
                    followLoadingId === brand.id ||
                    unfollowLoadingId === brand.id
                  }
                >
                  {followLoadingId === brand.id ||
                  unfollowLoadingId === brand.id ? (
                    <Loader2 className="animate-spin" />
                  ) : brand.followed_by_current_user ? (
                    "Unfollow"
                  ) : (
                    "Follow"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No brands found</p>
      )}
    </div>
  );
}
