import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Preview } from "~/components/preview";
import type { BountyProps } from "~/lib/state/bounty/use-bounty-store";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import { sortOptionEnum } from "~/components/fan/creator/bounty/BountyList";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/shadcn/ui/card";
import { Award, Search, ChevronDown } from 'lucide-react';
import { Input } from "~/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/shadcn/ui/select";
import { Button } from "~/components/shadcn/ui/button";
import { addrShort } from "~/utils/utils";

const Bounty: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<sortOptionEnum>(sortOptionEnum.DATE_DESC);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

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
    void router.push(`/bounty/${bounty.id}`);
  };

  return (
    <div className="relative flex h-[calc(100vh-10.8vh)] w-full flex-col gap-4 overflow-y-auto px-3 pt-3 scrollbar-hide md:mx-auto md:w-[85vw] md:px-0 md:pt-4">
      <h1 className="text-3xl font-semibold tracking-tight text-black/90">Available Bounties</h1>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-full md:w-1/2">
          <Input
            type="search"
            placeholder="Search bounties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-xl border-[#ddd9d0] bg-white pl-10 pr-4"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        </div>
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as sortOptionEnum)}>
          <SelectTrigger className="h-11 w-full rounded-xl border-[#ddd9d0] bg-white md:w-[220px]">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {getAllBounty.data?.pages.map((page, pageIndex) => (
            <React.Fragment key={pageIndex}>
              {page.bounties.map((bounty) => (
                <Card
                  key={bounty.id}
                  className="group relative h-full cursor-pointer overflow-hidden rounded-[0.95rem] border border-[#ddd9d0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  onClick={() => handleBountyClick(bounty as BountyProps)}
                >
                  <CardHeader className="relative p-0">
                    <div className="relative h-52 w-full overflow-hidden rounded-t-[0.95rem] bg-[#d8c7bb]">
                      <Image
                        src={bounty.imageUrls[0] ?? "/images/logo.png"}
                        alt={bounty.title}
                        width={400}
                        height={200}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative flex flex-col p-0">
                    <div className="flex flex-1 flex-col gap-2 px-4 pb-3.5 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex w-fit rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-sm font-medium text-black/60">
                          Bounty
                        </div>
                        <div className="inline-flex w-fit rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-sm font-medium text-black/60">
                          {bounty.totalWinner === bounty.currentWinnerCount ? "Completed" : "Active"}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="line-clamp-1 text-[0.98rem] font-semibold leading-tight text-black/90">
                          {bounty.title}
                        </CardTitle>
                        <p className="shrink-0 truncate font-mono text-sm text-foreground/70">
                          {addrShort(bounty.creatorId, 4)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-black/88">
                        <Award className="h-4 w-4" />
                        <span className="text-[#1f86ee]">${bounty.priceInUSD.toFixed(2)}</span>
                        <span>{PLATFORM_ASSET.code.toLocaleUpperCase()}</span>
                        <span className="text-black/55">({bounty.priceInBand.toFixed(2)})</span>
                      </div>
                      <div className="h-[56px] overflow-hidden text-left text-sm text-black/55 [&_*]:text-left">
                        <Preview value={bounty.description.slice(0, 200)} />
                      </div>
                      <p className="text-sm text-black/52">
                        {`${bounty.totalWinner - bounty.currentWinnerCount} spots left · ${bounty._count.participants} participants`}
                      </p>
                    </div>
                  </CardContent>
                  <div className="relative z-20 mt-3 md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:translate-y-full md:opacity-0 md:transition-all md:duration-300 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100">
                    <Button
                      variant="default"
                      className="h-12 w-full rounded-none border-0 bg-[#1f86ee] px-4 text-base font-semibold text-white shadow-none hover:bg-[#1877da]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBountyClick(bounty as BountyProps);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {getAllBounty.hasNextPage && (
        <div className="mb-8 mt-4 text-center">
          <Button
            onClick={() => void getAllBounty.fetchNextPage()}
            disabled={getAllBounty.isFetchingNextPage}
            size="lg"
            className="group relative h-11 overflow-hidden rounded-xl bg-[#1f86ee] px-6 font-semibold text-white hover:bg-[#1877da]"
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

