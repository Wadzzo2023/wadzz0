"use client";

import React, { useEffect, useMemo, useState } from "react";
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

export default function BountyScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { setData } = useBounty();
  const { onOpen } = useModal();
  const router = useRouter();
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
  const bountyList = response.data?.allBounty ?? [];

  const filteredBounties = useMemo(() => {
    return bountyList.filter((bounty: Bounty) => {
      if (selectedFilter === "Joined") return bounty.isJoined;
      if (selectedFilter === "Not Joined") return !bounty.isJoined;
      return true; // "All"
    });
  }, [response.data, selectedFilter]);

  if (response.isLoading) return <Loading />;

  const toggleJoin = (id: string, isAlreadyJoin: boolean, bounty: Bounty) => {
    console.log("toggleJoin", id, isAlreadyJoin, bounty);
    if (isAlreadyJoin || bounty.isOwner) {
      setData({ item: bounty });
      router.push(`/play/bounty/${bounty.id}`);
    } else {
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
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Filter
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

      {filteredBounties.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p>No Bounty found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto ">
          {filteredBounties.map((bounty: Bounty) => (
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
                <div className="mb-4 h-36 overflow-y-auto">
                  {/* {parse(bounty.description.substring(0, 200))} */}
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={getStatusColor(bounty.status)}>
                    {bounty.status}
                  </Badge>
                  <div className="text-sm">
                    <p>Prize: ${bounty.priceInUSD.toFixed(2)}</p>
                    <p>Prize: {bounty.priceInBand.toFixed(2)} Wadzzo</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm">
                    Participants: {bounty._count.participants}
                  </p>
                  <Badge
                    variant={bounty._count.BountyWinner === 0 ? "destructive" : "default"}
                  >
                    {bounty.totalWinner === bounty._count.BountyWinner ? "Finished" : (bounty.totalWinner - bounty._count.BountyWinner) + " Winner Left"}
                  </Badge>
                </div>


              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={bounty.status === "REJECTED"}
                  variant={bounty.isJoined ? "outline" : "default"}
                  onClick={() => toggleJoin(bounty.id, bounty.isJoined, bounty)}
                >
                  {bounty.isJoined || bounty.isOwner ? "View Bounty" : "Join Bounty"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
