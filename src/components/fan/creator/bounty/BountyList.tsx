import { format } from "date-fns";
import { Award, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CardFooter } from "package/connect_wallet/src/shadcn/ui/card";
import { useEffect, useState } from "react";
import { Preview } from "~/components/preview";
import { Badge } from "~/components/shadcn/ui/badge";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

import { api } from "~/utils/api";

export enum sortOptionEnum {
  DATE_ASC = "DATE_ASC",
  DATE_DESC = "DATE_DESC",
  PRICE_ASC = "PRICE_ASC",
  PRICE_DESC = "PRICE_DESC",
}

export enum statusFilterEnum {
  ALL = "ALL",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const BountyList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<sortOptionEnum>(
    sortOptionEnum.DATE_ASC,
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<statusFilterEnum>(
    statusFilterEnum.ALL,
  );

  const getAllBounty = api.bounty.Bounty.getAllBountyByUserId.useInfiniteQuery(
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
  return (
    <div className="p-4">
      <div>
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
                  className="absolute bottom-2.5 end-2.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
              className="mb-6 block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
              <option value="DATE_ASC">Date (Oldest to Newest)</option>
              <option value="DATE_DESC">Date (Newest to Oldest)</option>
              <option value="PRICE_ASC">
                Prize Size (Smallest to Largest)
              </option>
              <option value="PRICE_DESC">
                Prize Size (Largest to Smallest)
              </option>
            </select>
          </div>
        </div>
      </div>
      {/* <div className="flex flex-col gap-2">
        {getAllBounty.data &&
          getAllBounty.data.pages[0]?.bounties.length === 0 && (
            <p className="w-full text-center">There is no page asset yet</p>
          )}
        {getAllBounty.data?.pages.map((page) => (
          <>
            {page.bounties.map((bounty) => (
              <>
                <Link href={`/bounty/${bounty.id}`} key={bounty.id}>
                  <div className="relative  block overflow-hidden rounded-lg border border-slate-100 bg-white p-8 shadow-xl">
                    <div className="justify-between sm:flex">
                      <div>
                        <h5 className="text-xl font-bold text-slate-900">
                          {bounty.title}
                        </h5>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          By {bounty.creator.name}
                        </p>
                      </div>

                      <div className="ml-3 hidden flex-shrink-0 sm:block">
                        {bounty.imageUrls && (
                          <Image
                            src={bounty.imageUrls[0] ?? "/images/logo.png"}
                            height={1000}
                            width={1000}
                            alt=""
                            className="h-16 w-16 rounded-lg object-cover shadow-sm"
                          />
                        )}
                      </div>
                    </div>

                    <div className=" ">
                      <p className="min-h-[100px] text-sm text-slate-500">
                        <Preview value={bounty.description.slice(0, 200)} />
                      </p>
                    </div>

                    <dl className="mt-6 flex flex-col justify-between gap-2 md:flex-row ">
                      <div className="flex flex-col-reverse border-b-2 md:border-none">
                        <dt className="text-sm font-medium text-slate-600">
                          Published
                        </dt>
                        <dd className="text-xs text-slate-500">
                          {format(new Date(bounty.createdAt), "MM/dd/yyyy")}
                        </dd>
                      </div>
                      <div className="flex flex-col-reverse border-b-2  md:border-none">
                        <dt className="text-sm font-medium uppercase text-slate-600">
                          Status
                        </dt>
                        {bounty.status === "PENDING" ? (
                          <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-indigo-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-indigo-900">
                            <span className="">{bounty.status}</span>
                          </div>
                        ) : bounty.status === "APPROVED" ? (
                          <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-green-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-green-900">
                            <span className="">{bounty.status}</span>
                          </div>
                        ) : (
                          <div className="relative grid select-none items-center whitespace-nowrap rounded-md bg-red-500/20 px-2 py-1 font-sans text-xs font-bold uppercase text-red-900">
                            <span className="">{bounty.status}</span>
                          </div>
                        )}
                      </div>
                      <div className=" flex flex-col-reverse ">
                        <dt className="text-sm font-medium text-slate-600">
                          Total Participants
                        </dt>
                        <dd className="text-xs text-slate-500">
                          {bounty._count.participants}
                        </dd>
                      </div>
                      <div className="relative  bg-gradient-to-r from-blue-500 via-teal-500 to-pink-500 bg-clip-text    text-transparent ">
                        <div>Prize in $: {bounty.priceInUSD}</div>
                        <div>
                          prize in {PLATFORM_ASSET.code}: {bounty.priceInBand}{" "}
                        </div>
                      </div>
                    </dl>
                  </div>
                </Link>
              </>
            ))}
          </>
        ))}
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
      </div> */}

      <div className="w-full md:py-8">
        <h1 className="mb-6 text-3xl font-bold">Available Bounties</h1>
        <div className="grid grid-flow-row grid-cols-1 gap-6 md:grid-cols-2 ">
          {getAllBounty.data &&
            getAllBounty.data.pages[0]?.bounties.length === 0 && (
              <p className="w-full text-center">There is no page asset yet</p>
            )}
          {getAllBounty.data?.pages.map((page) => (
            <>
              {page.bounties.map((bounty) => (
                <>
                  <Link href={`/bounty/${bounty.id}`} key={bounty.id}>
                    <Card
                      key={bounty.id}
                      className="flex  max-h-[480px] min-h-[480px] flex-col"
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
                          {bounty.priceInUSD} USD (
                          {bounty.priceInBand.toFixed(3)} {PLATFORM_ASSET.code})
                        </div>
                        <div className="max-h-[85px] min-h-[85px]">
                          <span className="font-semibold">Requirements:</span>
                          <ul className="mt-2 list-inside list-disc">
                            {
                              <Preview
                                value={bounty.description.slice(0, 100)}
                              />
                            }
                          </ul>
                        </div>
                      </CardContent>
                      <CardFooter className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="secondary" className="mr-2">
                            {bounty._count.participants} participants
                          </Badge>
                          <Badge
                            variant={bounty._count.BountyWinner === 0 ? "destructive" : "default"}
                          >
                            {bounty.totalWinner === bounty._count.BountyWinner ? "Finished" : (bounty.totalWinner - bounty._count.BountyWinner) + " Winner Left"}
                          </Badge>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
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
    </div>
  );
};
export default BountyList;
