import { MarketType } from "@prisma/client";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { useModal } from "~/components/hooks/use-modal-store";
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
  const { onOpen } = useModal();

  const handleEdit = useCallback(() => {
    console.log("Edit");
  }, []);

  const handleDelete = useCallback(() => {
    console.log("Delete");
  }, []);

  if (getAllBounty.data)
    return (
      <div className="w-full bg-white p-4">
        <div className="flex flex-col gap-2">
          {getAllBounty.data.pages[0]?.bounties.length === 0 ||
          getAllBounty.data.pages[0]?.bounties === undefined ? (
            <p className="w-full text-center text-xl">
              There is no Bounty yet!!
            </p>
          ) : (
            <></>
          )}
          <div className="">
            <table className="mt-4 w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="cursor-pointer border-y border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                    <p className="flex items-center justify-between gap-2 font-sans text-sm font-normal  text-slate-500">
                      Title
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                        ></path>
                      </svg>
                    </p>
                  </th>
                  <th className="cursor-pointer border-y border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                    <p className="flex items-center justify-between gap-2 font-sans text-sm font-normal leading-none text-slate-500">
                      Description
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                        ></path>
                      </svg>
                    </p>
                  </th>
                  <th className="cursor-pointer border-y border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                    <p className="flex items-center justify-between gap-2 font-sans text-sm  font-normal leading-none text-slate-500">
                      Status
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                        ></path>
                      </svg>
                    </p>
                  </th>
                  <th className="cursor-pointer border-y border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                    <p className="flex items-center justify-between gap-2 font-sans text-sm  font-normal leading-none text-slate-500">
                      Action
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                        ></path>
                      </svg>
                    </p>
                  </th>
                  <th className="cursor-pointer border-y border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                    <p className="flex items-center justify-between gap-2 font-sans text-sm  font-normal leading-none text-slate-500"></p>
                  </th>
                </tr>
              </thead>
              {getAllBounty.data.pages.map((page) => (
                <>
                  {page.bounties.map((bounty) => (
                    <>
                      <tbody key={bounty.id}>
                        <tr>
                          <td className="border-b border-slate-200 p-4">
                            <div className="flex items-center gap-3">
                              {bounty.imageUrls && (
                                <Image
                                  src={
                                    bounty.imageUrls[0] ?? "/images/logo.png"
                                  }
                                  height={100}
                                  width={100}
                                  alt="John Michael"
                                  className="relative inline-block h-9 w-9 !rounded-full object-cover object-center"
                                />
                              )}

                              <p className="text-sm font-semibold text-slate-700">
                                {FormatTitle(bounty.title)}
                              </p>
                            </div>
                          </td>
                          <td className="border-b border-slate-200 p-4">
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold text-slate-700">
                                <Preview
                                  value={bounty.description.slice(0, 50)}
                                />
                              </p>
                            </div>
                          </td>
                          <td className="border-b border-slate-200 p-4">
                            <div className="w-max">
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
                          </td>

                          <td className="flex items-center justify-center border-b border-slate-200 p-4">
                            <button
                              onClick={() =>
                                onOpen("edit bounty", {
                                  bountyId: bounty.id,
                                })
                              }
                              className="relative h-10 max-h-[40px] w-10 max-w-[40px] select-none rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-slate-900 transition-all hover:bg-slate-900/10 active:bg-slate-900/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                              type="button"
                            >
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                  className="h-6 w-6"
                                >
                                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z"></path>
                                </svg>
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                handleDelete;
                              }}
                              className="relative h-10 max-h-[40px] w-10 max-w-[40px] select-none rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-slate-900 transition-all hover:bg-slate-900/10 active:bg-slate-900/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                              type="button"
                            >
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke-width="1.5"
                                  stroke="currentColor"
                                  className="h-6 w-6"
                                  x-tooltip="tooltip"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </>
                  ))}
                </>
              ))}
            </table>
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
export default Bounty;

function FormatTitle(title: string) {
  if (title.length > 70) {
    return title.slice(0, 70) + "...";
  }
  return title;
}
