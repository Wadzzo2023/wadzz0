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
      <div className="flex flex-col gap-2">
        {getAllBounty.data &&
        getAllBounty.data.pages[0]?.bounties.length === 0 ? (
          <p className="w-full text-center text-xl">There is no Bounty yet!!</p>
        ) : (
          <></>
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
                  <div className="relative  block overflow-hidden rounded-lg border border-slate-100 bg-white p-8 shadow-xl">
                    <div className="justify-between sm:flex">
                      <div>
                        <h5 className="text-xl font-bold text-slate-900">
                          {bounty.title}
                        </h5>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          By {bounty.creator.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          Winner:{" "}
                          {bounty.winner?.name ? (
                            <span className="me-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                              {bounty.winner.name}
                            </span>
                          ) : (
                            <span className="me-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                              NOT ANNOUNCED
                            </span>
                          )}
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

                    <dl className="mt-6 flex flex-col justify-between gap-2 md:flex-row  ">
                      <div className="flex flex-col-reverse border-b-2 md:border-none">
                        <dt className="text-sm font-medium uppercase text-slate-600">
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
                      <div className=" flex-col-reverse border-b-2  md:border-none">
                        <dt className="text-sm font-medium uppercase text-slate-600">
                          Total Participants
                        </dt>
                        <dd className="text-xs text-slate-500">
                          {bounty._count.participants}
                        </dd>
                      </div>
                      <div className="relative  bg-gradient-to-r from-blue-500 via-teal-500 to-pink-500 bg-clip-text    text-transparent">
                        <div>Prize in USD : ${bounty.priceInUSD}</div>
                        <div>
                          Prize in {PLATFORM_ASSET.code}: {bounty.priceInBand}{" "}
                        </div>
                      </div>
                    </dl>
                  </div>
                </div>
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
      </div>
    </div>
  );
};
export default Bounty;
