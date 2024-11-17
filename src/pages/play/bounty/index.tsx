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
import { Bounty } from "@prisma/client";
import Loading from "~/components/wallete/loading";
import { useBounty } from "~/components/hooks/play/useBounty";
import { useModal } from "~/components/hooks/play/useModal";
import { getAllBounties } from "../lib/get-all-bounties";
import { getUserPlatformAsset } from "../lib/get-user-platformAsset";
import { addrShort } from "~/utils/utils";

export default function BountyScreen() {
  const [refreshing, setRefreshing] = useState(false);

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

  const bountyList = response.data?.allBounty || [];

  const filteredBounties = useMemo(() => {
    return bountyList.filter((bounty: Bounty) => {
      if (selectedFilter === "Joined") return bounty.isJoined;
      if (selectedFilter === "Not Joined") return !bounty.isJoined;
      return true; // "All"
    });
  }, [selectedFilter, bountyList]);

  if (response.isLoading) return <Loading />;

  const toggleJoin = (id: string, isAlreadyJoin: boolean, bounty: Bounty) => {
    if (isAlreadyJoin) {
      setData({ item: bounty });
      router.push(`/bounty/${bounty.id}`);
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
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bounty</h1>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBounties.map((bounty: Bounty) => (
            <Card key={bounty.id} className="flex flex-col">
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
                  {parse(bounty.description.substring(0, 200))}
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
                <p className="text-sm">
                  Participants: {bounty._count.participants}
                </p>
                {bounty.winnerId && (
                  <p className="text-sm font-bold text-green-600">
                    Winner: {addrShort(bounty.winnerId, 15)}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={bounty.status === "REJECTED"}
                  variant={bounty.isJoined ? "outline" : "default"}
                  onClick={() => toggleJoin(bounty.id, bounty.isJoined, bounty)}
                >
                  {bounty.isJoined ? "View Bounty" : "Join Bounty"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
