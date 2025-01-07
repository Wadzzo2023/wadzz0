import { Award, Search } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Preview } from "~/components/preview";
import { Badge } from "~/components/shadcn/ui/badge";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Input } from "~/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/shadcn/ui/select";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

export enum sortOptionEnum {
  DATE_ASC = "DATE_ASC",
  DATE_DESC = "DATE_DESC",
  PRICE_ASC = "PRICE_ASC",
  PRICE_DESC = "PRICE_DESC",
}

const BountyList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<sortOptionEnum>(sortOptionEnum.DATE_DESC);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const getAllBounty = api.bounty.Bounty.getAllBountyByUserId.useInfiniteQuery(
    {
      limit: 10,
      search: debouncedSearchTerm,
      sortBy: sortOption,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Available Bounties</h1>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search bounties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        </div>

        <Select value={sortOption} onValueChange={(value) => setSortOption(value as sortOptionEnum)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort bounties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={sortOptionEnum.DATE_DESC}>Newest First</SelectItem>
            <SelectItem value={sortOptionEnum.DATE_ASC}>Oldest First</SelectItem>
            <SelectItem value={sortOptionEnum.PRICE_DESC}>Highest Prize</SelectItem>
            <SelectItem value={sortOptionEnum.PRICE_ASC}>Lowest Prize</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {getAllBounty.isLoading ? (
        <div className="text-center">Loading bounties...</div>
      ) : getAllBounty.data?.pages[0]?.bounties.length === 0 ? (
        <div className="text-center">No bounties found</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getAllBounty.data?.pages.map((page, pageIndex) => (
            <React.Fragment key={pageIndex}>
              {page.bounties.map((bounty) => (
                <Link href={`/bounty/${bounty.id}`} key={bounty.id}>
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
                    <CardHeader className="relative p-0">
                      <Image
                        src={bounty.imageUrls[0] ?? "/images/logo.png"}
                        alt={bounty.title}
                        width={400}
                        height={200}
                        className="h-48 w-full rounded-t-lg object-cover"
                      />
                    </CardHeader>
                    <CardContent className="flex-grow p-4 max-h-[300px] min-h-[300px]">
                      <CardTitle className="mb-2 line-clamp-2">{bounty.title}</CardTitle>
                      <div className="mb-2 text-sm text-red-600">
                        <Award className="mr-1 inline-block h-4 w-4" />
                        {bounty.priceInUSD} USD ({bounty.priceInBand.toFixed(3)} {PLATFORM_ASSET.code})
                      </div>
                      <div className="mb-4 line-clamp-3 text-sm text-gray-500">
                        <Preview value={bounty.description.slice(0, 200)} />
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t p-4">
                      <Badge variant="secondary">
                        {bounty._count.participants} participants
                      </Badge>
                      <Badge variant={bounty._count.BountyWinner === 0 ? "outline" : "default"}>
                        {bounty.totalWinner === bounty.currentWinnerCount
                          ? "Finished"
                          : `${bounty.totalWinner - bounty.currentWinnerCount} Winner${bounty.totalWinner - bounty.currentWinnerCount > 1 ? "s" : ""
                          } Left`}
                      </Badge>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {getAllBounty.hasNextPage && (
        <div className="mt-8 text-center">
          <Button
            onClick={() => void getAllBounty.fetchNextPage()}
            disabled={getAllBounty.isFetchingNextPage}
          >
            {getAllBounty.isFetchingNextPage ? "Loading more..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BountyList;

