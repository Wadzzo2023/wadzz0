import { useEffect, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Preview } from "~/components/preview";
import {
  BountyProps,
  useBountyRightStore,
} from "~/lib/state/bounty/use-bounty-store";
import { usePopUpState } from "~/lib/state/right-pop";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import { getTailwindScreenSize } from "~/utils/clientUtils";
import {
  sortOptionEnum,
  statusFilterEnum,
} from "~/components/fan/creator/bounty/BountyList";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import { Award } from "lucide-react";

const Bounty = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<sortOptionEnum>(
    sortOptionEnum.DATE_ASC,
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<statusFilterEnum>(
    statusFilterEnum.ALL,
  );

  const getAllBounty = api.bounty.Bounty.getAllBounties.useInfiniteQuery(
    {
      limit: 10,
      search: debouncedSearchTerm,
      sortBy: sortOption,
      status: statusFilter,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSortOption(e.target.value as sortOptionEnum);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setStatusFilter(e.target.value as statusFilterEnum);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500);

    // Cleanup the timeout if the user types again before 2 seconds
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const bountyStore = useBountyRightStore();
  const pop = usePopUpState();

  return (
    <div className="p-4">
      <div>
        <div>
          <h2 className="mb-5 text-center text-2xl font-bold">Bounty</h2>
        </div>
        <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
          <div className="">
            <form className="">
              <div className="relative">
                <input
                  type="search"
                  id="default-search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="Search Mockups, Logos..."
                  required
                />
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="absolute bottom-2.5 end-2.5 rounded-lg bg-blue-700 px-4 py-2  text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
          <div className="flex items-center justify-center gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="mb-6 block w-full rounded-lg border  border-gray-300 bg-gray-50 p-4  text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="ALL">All Bounty</option>
              <option value="ACTIVE">Active Bounty</option>
              <option value="FINISHED">Finished Bounty</option>
            </select>

            <select
              value={sortOption}
              onChange={handleSortChange}
              className="mb-6 block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            >
              <option value="DATE_ASC">Date Ascending</option>
              <option value="DATE_DESC">Date Descending</option>
              <option value="PRICE_ASC">Prize Ascending</option>
              <option value="PRICE_DESC">Prize Descending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-flow-row grid-cols-1 gap-6 md:grid-cols-2 	">
        {getAllBounty.data &&
          getAllBounty.data.pages[0]?.bounties.length === 0 && (
            <p className="w-full text-center">There is no page asset yet</p>
          )}
        {getAllBounty.data?.pages.map((page) => (
          <>
            {page.bounties.map((bounty) => (
              <>
                <div
                  key={bounty.id}
                  onClick={() => {
                    bountyStore.setData(bounty as BountyProps);
                    if (!getTailwindScreenSize().includes("xl")) {
                      pop.setOpen(true);
                    }
                  }}
                >
                  <Card
                    key={bounty.id}
                    className="flex  max-h-[480px] min-h-[480px] flex-col "
                  >
                    <CardHeader>
                      <div className="relative">
                        <Image
                          src={bounty.imageUrls[0] ?? "/images/logo.png"}
                          alt={bounty.title}
                          width={200}
                          height={100}
                          className="h-40 w-full rounded-t-lg object-cover"
                        />
                        <Badge
                          variant={
                            bounty.status === "APPROVED"
                              ? "default"
                              : "destructive"
                          }
                          className="absolute right-2 top-2"
                        >
                          {bounty.status === "APPROVED"
                            ? "Approved"
                            : "Pending"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{bounty.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="mb-4">
                        <span className="font-semibold">Prize Pool:</span>{" "}
                        {bounty.priceInUSD} USD ({bounty.priceInBand.toFixed(3)}{" "}
                        {PLATFORM_ASSET.code})
                      </div>
                      <div className="max-h-[85px] min-h-[85px]">
                        <span className="font-semibold ">Requirements:</span>
                        <ul className="mt-2 list-inside list-disc">
                          {<Preview value={bounty.description.slice(0, 100)} />}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2">
                          {bounty._count.participants} participants
                        </Badge>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={bounty.winner ? "destructive" : "default"}
                          >
                            {bounty.winner ? "Finished" : "Active"}
                          </Badge>
                          {bounty.winner && (
                            <div className="flex items-center">
                              <Award className="mr-1 h-4 w-4 text-yellow-500" />
                              <span className="mr-2 text-sm font-medium">
                                Winner:
                              </span>

                              <span className="text-sm">
                                {bounty.winner.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </>
            ))}
          </>
        ))}
      </div>
      <div className="mt-5">
        {getAllBounty.hasNextPage && (
          <button
            className="btn btn-outline btn-primary"
            onClick={() => void getAllBounty.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
};
export default Bounty;
