"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown } from "lucide-react";

import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";

import Loading from "~/components/wallete/loading";
import { useBounty } from "~/lib/state/play/useBounty";
import { useModal } from "~/lib/state/play/useModal";

import { addrShort } from "~/utils/utils";
import { getUserPlatformAsset } from "~/lib/play/get-user-platformAsset";
import { getAllBounties } from "~/lib/play/get-all-bounties";
import { Bounty } from "~/types/game/bounty";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { Preview } from "~/components/preview";
import { Walkthrough } from "~/components/walkthrough";
import toast from "react-hot-toast";
import { useWalkThrough } from "~/components/hooks/play/useWalkthrough";


type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function BountyScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { setData } = useBounty();
  const { onOpen } = useModal();
  const router = useRouter();
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);
  const { data: walkthroughData } = useWalkThrough();

  const response = useQuery({
    queryKey: ["bounties"],
    queryFn: getAllBounties,
  });

  const balanceRes = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Filter Bounty",
      content:
        "User can filter bounty between Joined and Not Joined Bounty List.",
    },
    {
      target: buttonLayouts[1],
      title: "View/Join Bounty",
      content:
        "Clicking 'Join Bounty' lets users view details and join. If already joined, they can view details only.",
    },
  ];
  const bountyList = response.data?.allBounty ?? [];
  const dummyBounties: Bounty[] = [
    {
      title: "Bounty 1",
      description: "This is a bounty description",
      priceInUSD: 100,
      priceInBand: 100,
      status: "APPROVED",
      isJoined: false,
      _count: {
        participants: 10,
        BountyWinner: 1,
      },
      imageUrls: ["https://app.wadzzo.com/images/loading.png"],
      totalWinner: 4,
      BountyWinner: [],
      creator: {
        name: "Creator 1",
        profileUrl: "https://app.wadzzo.com/images/loading.png",
      },
      id: "1",
      creatorId: "0x1234567890",
      requiredBalance: 100,
      isOwner: false,
    },
  ];

  useLayoutEffect(() => {
    const updateButtonLayouts = () => {
      const filterButton = filterButtonRef.current;
      const joinButton = joinButtonRef.current;

      if (filterButton && joinButton) {
        const filterRect = filterButton.getBoundingClientRect();
        const joinRect = joinButton.getBoundingClientRect();

        setButtonLayouts((prevLayouts) => {
          const newLayouts = [
            {
              x: filterRect.left,
              y: filterRect.top,
              width: filterRect.width,
              height: filterRect.height,
            },
            {
              x: joinRect.left,
              y: joinRect.top,
              width: joinRect.width,
              height: joinRect.height,
            },
          ];

          // Compare previous and new layouts to prevent unnecessary updates
          if (
            JSON.stringify(prevLayouts) !== JSON.stringify(newLayouts)
          ) {
            return newLayouts;
          }
          return prevLayouts;
        });
      }
    };

    // Throttle updates using a flag
    let animationFrameId: number | null = null;

    const observer = new MutationObserver(() => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateButtonLayouts);
    });

    // Observe only the parent container for efficiency
    const container = document.body;
    observer.observe(container, { childList: true, subtree: true });

    // Initial calculation
    updateButtonLayouts();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
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

  const filteredBounties = useMemo(() => {
    return bountyList.filter((bounty: Bounty) => {
      if (selectedFilter === "Joined") return bounty.isJoined;
      if (selectedFilter === "Not Joined") return !bounty.isJoined && !bounty.isOwner;
      return true; // "All"
    });
  }, [selectedFilter]);

  if (response.isLoading) return <Loading />;

  const toggleJoin = (id: string, isAlreadyJoin: boolean, bounty: Bounty) => {

    if (isAlreadyJoin || bounty.isOwner) {
      setData({ item: bounty });
      router.push(`/play/bounty/${bounty.id}`);
    }
    else if (bounty.totalWinner === bounty._count.BountyWinner) {
      toast.error("Bounty is already finished");
    }
    else {
      onOpen("JoinBounty", { bounty: bounty, balance: balanceRes.data });
    }
  };

  const getStatusColor = (status: Bounty["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-500";
      case "REJECTED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex h-screen flex-col p-2 pb-16">
      <div className="mb-4 flex items-center justify-between rounded-b-2xl bg-[#38C02B] p-4">
        <h1 className=" text-2xl font-bold">Bounty</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button ref={filterButtonRef} variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {selectedFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["All", "Joined", "Not Joined"].map((filter) => (
              <DropdownMenuItem
                key={filter}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {
        <div className="flex flex-col gap-2 overflow-y-auto ">
          {
            showWalkthrough ? (

              dummyBounties.map((bounty: Bounty) => (
                <Card key={bounty.id} className="flex flex-col ">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={
                          bounty.imageUrls[0] ??
                          "https://app.wadzzo.com/images/loading.png"
                        }
                        alt={bounty.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardTitle className="mb-2">{bounty.title}</CardTitle>
                    <div className="mb-4 min-h-36 max-h-36 overflow-y-auto">
                      <Preview value={bounty.description} />
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      {/* <Badge className={getStatusColor(bounty.status)}>
                        {bounty.status}
                      </Badge> */}
                      <div className="text-sm">
                        <p>Prize: ${bounty.priceInUSD.toFixed(2)}</p>
                        <p>
                          Prize: {bounty.priceInBand.toFixed(2)}{" "}
                          {PLATFORM_ASSET.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm">
                        Participants: {bounty._count.participants}
                      </p>
                      <Badge
                        variant={
                          bounty._count.BountyWinner === 0
                            ? "destructive"
                            : "default"
                        }
                      >
                        {bounty.totalWinner === bounty._count.BountyWinner
                          ? "Finished"
                          : bounty.totalWinner -
                          bounty._count.BountyWinner +
                          " Winner Left"}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      ref={joinButtonRef}
                      className="w-full"
                      disabled={bounty.status === "REJECTED"}
                      variant={bounty.isJoined ? "outline" : "default"}
                      onClick={() => toggleJoin(bounty.id, bounty.isJoined, bounty)}
                    >
                      {bounty.isJoined || bounty.isOwner
                        ? "View Bounty"
                        : bounty.totalWinner !== bounty._count.BountyWinner ? "Join Bounty" : "Finished"}
                    </Button>
                  </CardFooter>
                </Card>
              ))

            )
              : filteredBounties.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p>No Bounty found</p>
                </div>
              ) : (
                (
                  filteredBounties.map((bounty: Bounty) => (
                    <Card key={bounty.id} className="flex flex-col ">
                      <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                          <Image
                            src={
                              bounty.imageUrls[0] ??
                              "https://app.wadzzo.com/images/loading.png"
                            }
                            alt={bounty.title}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <CardTitle className="mb-2">{bounty.title}</CardTitle>
                        <div className="mb-4 min-h-36 max-h-36 overflow-y-auto">
                          <Preview value={bounty.description} />
                        </div>
                        <div className="mb-2 flex items-center justify-between">
                          <Badge className={getStatusColor(bounty.status)}>
                            {bounty.status}
                          </Badge>
                          <div className="text-sm">
                            <p>Prize: ${bounty.priceInUSD.toFixed(2)}</p>
                            <p>
                              Prize: {bounty.priceInBand.toFixed(2)}{" "}
                              {PLATFORM_ASSET.code}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm">
                            Participants: {bounty._count.participants}
                          </p>
                          <Badge
                            variant={
                              bounty._count.BountyWinner === 0
                                ? "destructive"
                                : "default"
                            }
                          >
                            {bounty.totalWinner === bounty._count.BountyWinner
                              ? "Finished"
                              : bounty.totalWinner -
                              bounty._count.BountyWinner +
                              " Winner Left"}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          ref={joinButtonRef}
                          className="w-full"
                          variant={bounty.isJoined ? "outline" : "default"}
                          onClick={() => toggleJoin(bounty.id, bounty.isJoined, bounty)}
                        >
                          {bounty.isJoined || bounty.isOwner
                            ? "View Bounty"
                            : bounty.totalWinner !== bounty._count.BountyWinner ? "Join Bounty" : "Finished"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ))
          }

        </div>
      }
      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}
