import { MarketType } from "@prisma/client";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Preview } from "~/components/preview";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";

import { api } from "~/utils/api";

const BountyList = () => {
  const getAllBounty = api.bounty.Bounty.getAllBountyByUserId.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (getAllBounty.data)
    return (
      <div className="p-4">
        <div className="flex flex-col gap-2">
          {getAllBounty.data.pages[0]?.bounties.length === 0 && (
            <p className="w-full text-center">There is no page asset yet</p>
          )}
          {getAllBounty.data.pages.map((page) => (
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
                          <dt className="text-sm font-medium text-slate-600">
                            Published
                          </dt>
                          <dd className="text-xs text-slate-500">
                            {format(new Date(bounty.createdAt), "MM/dd/yyyy")}
                          </dd>
                        </div>

                        <div className="ml-3 flex flex-col-reverse sm:ml-6">
                          <dt className="text-sm font-medium text-slate-600">
                            Total Participants
                          </dt>
                          <dd className="text-xs text-slate-500">
                            {bounty._count.participants}
                          </dd>
                        </div>
                        <div className="text-sm font-medium">
                          <div>Price in $: {bounty.priceInUSD}</div>
                          <div>
                            Price in {PLATFROM_ASSET.code}: {bounty.priceInBand}{" "}
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
        </div>
      </div>
    );
};
export default BountyList;
