import Image from "next/image";

import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useModal } from "~/lib/state/play/use-modal-store";
import { Preview } from "~/components/preview";

import { api } from "~/utils/api";

import { addrShort } from "~/utils/utils";
import { Badge } from "~/components/shadcn/ui/badge";

const Bounty = () => {
  const getAllBounty = api.bounty.Bounty.getAllBounties.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const [loadingBountyId, setLoadingBountyId] = useState<number | null>(null);

  const { onOpen } = useModal();
  const utils = api.useUtils();
  const DeleteMutation = api.bounty.Bounty.deleteBounty.useMutation({
    onSuccess: async () => {
      toast.success("Bounty Deleted");
      utils.bounty.Bounty.getAllBounties.refetch().catch((e) => {
        //console.log(e);
      });
    },
  });
  const GetDeleteXDR = api.bounty.Bounty.getDeleteXdr.useMutation({
    onSuccess: async (data, variables) => {
      if (data) {
        setLoadingBountyId(variables.bountyId);
        const res = await submitSignedXDRToServer4User(data);
        if (res) {
          DeleteMutation.mutate({
            BountyId: GetDeleteXDR.variables?.bountyId ?? 0,
          });
        } else {
          setLoadingBountyId(null);
        }
      }
    },
    onError: (error) => {
      setLoadingBountyId(null);
      toast.error(error.message);
    },
  });
  const handleDelete = useCallback(
    (prize: number, id: number, creatorId: string) => {
      setLoadingBountyId(id);
      GetDeleteXDR.mutate({ prize: prize, bountyId: id, creatorId: creatorId });
      setLoadingBountyId(null);
    },
    [GetDeleteXDR],
  );

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
                      Winning Status
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
                          <td className="border-b border-slate-200 p-4">
                            <div className="w-max">
                              <Badge
                                variant={bounty._count.BountyWinner === 0 ? "destructive" : "default"}
                              >
                                {bounty.totalWinner === bounty.currentWinnerCount ? "Finished" : "Active"}
                              </Badge>
                            </div>
                          </td>
                          <td className="border-b border-slate-200 p-4">
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
                              disabled={
                                loadingBountyId === bounty.id || bounty.BountyWinner.length > 0
                                  ? true
                                  : false
                              }
                              onClick={() => {
                                handleDelete(
                                  bounty.priceInBand,
                                  bounty.id,
                                  bounty.creatorId,
                                );
                              }}
                              className="relative h-10 max-h-[40px] w-10 max-w-[40px] select-none rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-slate-900 transition-all hover:bg-slate-900/10 active:bg-slate-900/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                              type="button"
                            >
                              {loadingBountyId === bounty.id ? (
                                <svg
                                  aria-hidden="true"
                                  role="status"
                                  className="mr-2 inline h-4 w-4 animate-spin text-gray-200 dark:text-gray-600"
                                  viewBox="0 0 100 101"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="currentColor"
                                  ></path>
                                  <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="#1C64F2"
                                  ></path>
                                </svg>
                              ) : (
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
                              )}
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
