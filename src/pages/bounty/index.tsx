import { MarketType } from "@prisma/client";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Preview } from "~/components/preview";
import { useBountyRightStore } from "~/lib/state/bounty/use-bounty-store";
import { usePopUpState } from "~/lib/state/right-pop";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import { getTailwindScreenSize } from "~/utils/clientUtils";

const Bounty = () => {
  const getAllBounty = api.bounty.Bounty.getAllBounties.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const bountyStore = useBountyRightStore();
  const pop = usePopUpState();

  if (getAllBounty.data)
    return (
      <div className="p-4">
        <div className="flex flex-col gap-2">
          {getAllBounty.data.pages[0]?.bounties.length === 0 ||
          getAllBounty.data.pages[0]?.bounties === undefined ? (
            <p className="w-full text-center text-xl">
              There is no Bounty yet!!
            </p>
          ) : (
            <></>
          )}

          {getAllBounty.data.pages.map((page) => (
            <>
              {page.bounties.map((bounty) => (
                <>
                  <div
                    key={bounty.id}
                    onClick={() => {
                      bountyStore.setData(bounty);
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
                        </div>

                        <div className="ml-3 hidden flex-shrink-0 sm:block">
                          {bounty.imageUrls ? (
                            <Image
                              src={bounty.imageUrls[0] ?? "/images/logo.png"}
                              height={1000}
                              width={1000}
                              alt=""
                              className="h-16 w-16 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>

                      <div className=" ">
                        <p className="min-h-[100px] text-sm text-slate-500">
                          <Preview value={bounty.description.slice(0, 200)} />
                        </p>
                      </div>

                      <dl className="mt-6 flex justify-between">
                        <div className="flex flex-col-reverse">
                          <dt className="text-sm font-medium uppercase text-slate-600">
                            Published
                          </dt>
                          <dd className="text-xs text-slate-500">
                            {format(new Date(bounty.createdAt), "MM/dd/yyyy")}
                          </dd>
                        </div>
                        <div className="flex flex-col-reverse">
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
                        <div className="ml-3 flex flex-col-reverse sm:ml-6">
                          <dt className="text-sm font-medium uppercase text-slate-600">
                            Total Participants
                          </dt>
                          <dd className="text-xs text-slate-500">
                            {bounty._count.participants}
                          </dd>
                        </div>
                        <div className="text-sm font-medium uppercase">
                          <div>Price in USD : ${bounty.priceInUSD}</div>
                          <div>
                            Price in {PLATFROM_ASSET.code}: {bounty.priceInBand}{" "}
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
