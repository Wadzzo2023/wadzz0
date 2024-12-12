import { getAllBrands, UnFollowBrand } from "~/lib/play";
// import LoadingScreen from "@/components/Loading";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Loader2, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign, WalletType } from "package/connect_wallet";
import toast from "react-hot-toast";
import { useAccountAction } from "~/components/hooks/play/useAccountAction";
import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { Input } from "~/components/shadcn/ui/input";
import { Switch } from "~/components/shadcn/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import Loading from "~/components/wallete/loading";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { Brand } from "~/types/game/brand";
import { api } from "~/utils/api";
import { Walkthrough } from "~/components/walkthrough";
import { useWalkThrough } from "~/components/hooks/play/useWalkthrough";
import { useBrandFollowMode } from "~/lib/state/play/useBrandFollowMode";

type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function CreatorPage() {
  const session = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [unfollowLoadingId, setUnfollowLoadingId] = useState<string | null>(
    null,
  );
  const [showWalkthrough, setShowWalkthrough] = useState(false);


  const [signLoading, setSingLoading] = useState(false);

  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);


  const { needSign } = useNeedSign();
  const { data: walkthroughData } = useWalkThrough();
  const { setData: setBrandFollowMode, data: brandFollowMode } = useBrandFollowMode()
  const modeButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLDivElement>(null);
  const brandListButtonRef = useRef<HTMLDivElement>(null);
  const followButtonRef = useRef<HTMLButtonElement>(null);


  const steps = [
    {
      target: buttonLayouts[0],
      title: "Follow Mode",
      content:
        "In Follow Mode, see pins for followed brands only. Switch to General Mode to view all brand pins.",
    },
    {
      target: buttonLayouts[1],
      title: "Search for Brands",
      content:
        "Use the search bar to look for any brand on the platform by typing in the brand name in the search bar, then pressing the search icon",
    },
    {
      target: buttonLayouts[2],
      title: "Brand Lists",
      content:
        "Click on 'Available Brands' to view all brands, or 'Followed Brands' to see the ones you've followed.",
    },
    {
      target: buttonLayouts[3],
      title: "Follow Brands",
      content:
        "To follow a brand, press the follow button next to the brand name. To unfollow a brand, press the unfollow button next to the brand name.",
    },
  ];
  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();

  const toggleBrandMode = () => {
    setBrandFollowMode(!brandFollowMode);
  };
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["AllBrands"],
    queryFn: getAllBrands,
  });

  const follow = api.fan.member.followCreator.useMutation({
    onSuccess: () => toast.success("Followed"),
  });
  const followXDR = api.fan.trx.followCreatorTRX.useMutation({
    onSuccess: async (xdr, variables) => {
      if (xdr) {
        if (xdr === true) {
          toast.success("User already has trust in page asset");
          follow.mutate({ creatorId: variables.creatorId });
        } else {
          setSingLoading(true);
          try {
            const res = await clientsign({
              presignedxdr: xdr,
              pubkey: session.data?.user.id,
              walletType: session.data?.user.walletType,
              test: clientSelect(),
            });

            if (res) {
              follow.mutate({ creatorId: variables.creatorId });
            } else toast.error("Transaction failed while signing.");
          } catch (e) {
            toast.error("Transaction failed while signing.");
            console.error(e);
          } finally {
            setSingLoading(false);
          }
        }
      } else {
        toast.error("Can't get xdr");
      }

      setFollowLoadingId(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setFollowLoadingId(null);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ brand_id }: { brand_id: string }) => {
      setUnfollowLoadingId(brand_id);
      return await UnFollowBrand({ brand_id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["AllBrands"],
      });
      setUnfollowLoadingId(null);
    },
    onError: (error) => {
      console.error("Error unfollowing brand:", error);
      setUnfollowLoadingId(null);
    },
  });

  const toggleFollow = (brandId: string, isAlreadyFollowed?: boolean) => {
    if (isAlreadyFollowed) {
      setUnfollowLoadingId(brandId);
      unfollowMutation.mutate({ brand_id: brandId });
    } else {
      setFollowLoadingId(brandId);
      followXDR.mutate({
        creatorId: brandId,
        signWith: needSign(),
      });
    }
  };

  useLayoutEffect(() => {
    const updateButtonLayouts = () => {
      const filterButton = modeButtonRef.current;
      const searchButton = searchButtonRef.current;
      const brandListButton = brandListButtonRef.current;
      const followButton = followButtonRef.current;

      if (filterButton && searchButton && brandListButton && followButton) {
        const filterRect = filterButton.getBoundingClientRect();
        const searchRect = searchButton.getBoundingClientRect();
        const brandListRect = brandListButton.getBoundingClientRect();
        const followRect = followButton.getBoundingClientRect();
        console.log("filterRect", filterRect);
        setButtonLayouts([
          {
            x: filterRect.left,
            y: filterRect.top,
            width: filterRect.width,
            height: filterRect.height,
          },
          {
            x: searchRect.left,
            y: searchRect.top,
            width: searchRect.width,
            height: searchRect.height,
          },
          {
            x: brandListRect.left,
            y: brandListRect.top,
            width: brandListRect.width,
            height: brandListRect.height,
          },
          {
            x: followRect.left,
            y: followRect.top,
            width: followRect.width,
            height: followRect.height,

          },

        ]);
      }
    };
    const observer = new MutationObserver(() => {
      updateButtonLayouts();
    });

    // Start observing the document for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial layout calculation
    updateButtonLayouts();

    // Clean up the observer
    return () => {
      observer.disconnect();
    };
  }, []);

  const checkFirstTimeSignIn = async () => {
    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };

  useEffect(() => {
    console.log("walkthroughData", walkthroughData);
    checkFirstTimeSignIn();

  }, [walkthroughData]);

  useEffect(() => {
    if (data) {
      setBrands(data.users);
    }
  }, [data]);

  useEffect(() => {
    queryClient
      .refetchQueries({
        queryKey: ["MapsAllPins", accountActionData.brandMode],
      })
      .catch((e) => console.log(e));
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
    <div className="flex h-screen flex-col p-2 pb-16">
      <div className="mb-4 flex items-center justify-between rounded-b-2xl bg-[#38C02B] p-4">
        <h1 className="text-2xl font-bold">Brands</h1>
        <div className="flex items-center space-x-2 rounded-full bg-white p-1">
          <span
            className={`text-sm ${!brandFollowMode
              ? "font-bold text-[#38C02B]"
              : "text-gray-500"
              }`}
          >
            General
          </span>
          <Switch
            ref={modeButtonRef}
            checked={brandFollowMode}
            onCheckedChange={toggleBrandMode}
          />
          <span
            className={`text-sm ${brandFollowMode
              ? "font-bold text-[#FF5A5F]"
              : "text-gray-500"
              }`}
          >
            Follow
          </span>
        </div>
      </div>

      <div ref={searchButtonRef} className="relative mb-4">
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
        <TabsList ref={brandListButtonRef} className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available Brands</TabsTrigger>
          <TabsTrigger value="followed">Followed Brands</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredBrands?.length ? (
        <div className="flex flex-col gap-2 overflow-y-auto ">
          {filteredBrands.map((brand: Brand, index) => (
            <Card key={brand.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Image
                    height={400}
                    width={400}
                    src={brand.logo}
                    alt={brand.first_name}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="font-semibold">{brand.first_name}</span>
                </div>
                <Button
                  ref={index === 0 ? followButtonRef : null}
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
                  <Image
                    height={400}
                    width={400}
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
      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}
