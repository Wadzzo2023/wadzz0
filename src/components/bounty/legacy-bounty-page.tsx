import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Preview } from "~/components/preview";
import { BountyProps, useBountyRightStore } from "~/lib/state/bounty/use-bounty-store";
import { usePopUpState } from "~/lib/state/right-pop";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import { getTailwindScreenSize } from "~/utils/clientUtils";
import { sortOptionEnum } from "~/components/fan/creator/bounty/BountyList";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import { Award, Search, ChevronDown } from 'lucide-react';
import { Input } from "~/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/shadcn/ui/select";
import { Button } from "~/components/shadcn/ui/button";

const Bounty: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<sortOptionEnum>(sortOptionEnum.DATE_DESC);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const bountyStore = useBountyRightStore();
  const pop = usePopUpState();

  const getAllBounty = api.bounty.Bounty.getAllBounties.useInfiniteQuery(
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

  const handleBountyClick = (bounty: BountyProps) => {
    bountyStore.setData(bounty);
    if (!getTailwindScreenSize().includes("xl")) {
      pop.setOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-center">Available Bounties</h1>
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/2">
          <Input
            type="search"
            placeholder="Search bounties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        </div>
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as sortOptionEnum)}>
          <SelectTrigger className="w-full md:w-auto">
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
        <div className="text-center text-xl">Loading bounties...</div>
      ) : getAllBounty.data?.pages[0]?.bounties.length === 0 ? (
        <div className="text-center text-xl">No bounties found</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getAllBounty.data?.pages.map((page, pageIndex) => (
            <React.Fragment key={pageIndex}>
              {page.bounties.map((bounty) => (
                <Card
                  key={bounty.id}
                  className="flex h-full flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleBountyClick(bounty as BountyProps)}
                >
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
                    <CardTitle className="mb-2 line-clamp-2 text-xl">{bounty.title}</CardTitle>
                    <div className="mb-2 flex items-center text-sm text-red-600">
                      <Award className="mr-1 inline-block h-4 w-4" />
                      <span className="font-semibold">{bounty.priceInUSD} USD</span>
                      <span className="ml-1 text-xs text-red-500">
                        ({bounty.priceInBand.toFixed(3)} {PLATFORM_ASSET.code})
                      </span>
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
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {getAllBounty.hasNextPage && (
        <div className="mt-12 text-center">
          <Button
            onClick={() => void getAllBounty.fetchNextPage()}
            disabled={getAllBounty.isFetchingNextPage}
            size="lg"
            className="group relative overflow-hidden"
          >
            {getAllBounty.isFetchingNextPage ? (
              "Loading more..."
            ) : (
              <>
                Load More
                <ChevronDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Bounty;

