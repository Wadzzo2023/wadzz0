"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown } from 'lucide-react';
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";

import { useBounty } from "~/lib/state/play/useBounty";
import { useModal } from "~/lib/state/play/useModal";
import { getAllBounties } from "~/lib/play/get-all-bounties";
import { getUserPlatformAsset } from "~/lib/play/get-user-platformAsset";
import { Bounty } from "~/types/game/bounty";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { Preview } from "~/components/preview";
import { Walkthrough } from "~/components/walkthrough";
import { useWalkThrough } from "~/components/hooks/play/useWalkthrough";
import toast from "react-hot-toast";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
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
  const { data: bountyData, isLoading } = useQuery({
    queryKey: ["bounties"],
    queryFn: getAllBounties,
  });
  const { data: balanceData } = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });
  const bountyList = bountyData?.allBounty ?? [];
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
      currentWinnerCount: 1,
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

  useEffect(() => {
    const updateButtonLayouts = () => {
      const filterButton = filterButtonRef.current;
      const joinButton = joinButtonRef.current;

      if (filterButton && joinButton) {
        const filterRect = filterButton.getBoundingClientRect();
        const joinRect = joinButton.getBoundingClientRect();

        setButtonLayouts([
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
        ]);
      }
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateButtonLayouts);
    });

    observer.observe(document.body);
    updateButtonLayouts();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (walkthroughData?.showWalkThrough) {
      setShowWalkthrough(true);
    }
  }, [walkthroughData]);

  const filteredBounties = React.useMemo(() => {
    return bountyList.filter((bounty: Bounty) => {
      if (selectedFilter === "Joined") return bounty.isJoined;
      if (selectedFilter === "Not Joined") return !bounty.isJoined && !bounty.isOwner;
      return true;
    });
  }, [selectedFilter, bountyList]);

  const handleBountyAction = (bounty: Bounty) => {
    if (bounty.isJoined || bounty.isOwner) {
      setData({ item: bounty });
      router.push(`/play/bounty/${bounty.id}`);
    } else if (bounty.totalWinner === bounty.currentWinnerCount) {
      toast.error("Bounty is already finished");
    } else {
      onOpen("JoinBounty", { bounty: bounty, balance: balanceData });
    }
  };

  const getStatusColor = (status: Bounty["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500 text-white";
      case "PENDING":
        return "bg-amber-500 text-black";
      case "REJECTED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Filter Bounty",
      content: "User can filter bounty between Joined and Not Joined Bounty List.",
    },
    {
      target: buttonLayouts[1],
      title: "View/Join Bounty",
      content: "Clicking 'Join Bounty' lets users view details and join. If already joined, they can view details only.",
    },
  ];

  return (
    <div className="flex h-screen flex-col">
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-[#38C02B] p-4">
        <h1 className="text-2xl font-bold text-white">Bounty</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={filterButtonRef}
              variant="secondary"
              size="sm"
              className="min-w-[120px]"
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {selectedFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["All", "Joined", "Not Joined"].map((filter) => (
              <DropdownMenuItem
                key={filter}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-16">
        <div className="flex flex-col gap-2">
          {showWalkthrough ? (
            dummyBounties.map((bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onAction={handleBountyAction}
                getStatusColor={getStatusColor}
                joinButtonRef={joinButtonRef}
              />
            ))
          ) : isLoading ? (
            // Show skeleton cards while loading
            Array.from({ length: 3 }).map((_, index) => <BountyCardSkeleton key={`skeleton-${index}`} />)
          ) : filteredBounties.length === 0 ? (
            <div className="col-span-full flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500">No Bounty found</p>
            </div>
          ) : (
            filteredBounties.map((bounty: Bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onAction={handleBountyAction}
                getStatusColor={getStatusColor}
                joinButtonRef={joinButtonRef}
              />
            ))
          )}
        </div>
      </div>

      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}

interface BountyCardProps {
  bounty: Bounty;
  onAction: (bounty: Bounty) => void;
  getStatusColor: (status: Bounty["status"]) => string;
  joinButtonRef?: React.RefObject<HTMLButtonElement>;
}

function BountyCard({ bounty, onAction, getStatusColor, joinButtonRef }: BountyCardProps) {
  const isFinished = bounty.totalWinner === bounty.currentWinnerCount;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={bounty.imageUrls[0] ?? "https://app.wadzzo.com/images/loading.png"}
            alt={bounty.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge
            className={`absolute bottom-3 right-3 ${getStatusColor(bounty.status)}`}
          >
            {bounty.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold">{bounty.title}</h3>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
            <span>{bounty._count.participants} participants</span>
            <span>•</span>
            <span>${bounty.priceInUSD.toFixed(2)}</span>
          </div>
        </div>

        <div className="max-h-24 overflow-y-auto rounded-md bg-gray-50 p-3 text-sm">
          <Preview value={bounty.description} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Prize:</span>{" "}
            <span className="font-medium">
              {bounty.priceInBand.toFixed(2)} {PLATFORM_ASSET.code}
            </span>
          </div>
          <Badge variant={isFinished ? "secondary" : "outline"}>
            {isFinished
              ? "Finished"
              : `${bounty.totalWinner - bounty.currentWinnerCount} winner${bounty.totalWinner - bounty.currentWinnerCount !== 1 ? "s" : ""
              } left`
            }
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50 p-4">
        <Button
          ref={bounty.isJoined ? undefined : joinButtonRef}
          className="w-full"
          variant={bounty.isJoined || bounty.isOwner ? "outline" : "default"}
          disabled={bounty.status === "REJECTED"}
          onClick={() => onAction(bounty)}
        >
          {bounty.isJoined || bounty.isOwner
            ? "View Details"
            : isFinished
              ? "Bounty Finished"
              : "Join Bounty"}
        </Button>
      </CardFooter>
    </Card>
  );
}
function BountyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div>
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-2 flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <Skeleton className="h-24 w-full" />

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50 p-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}