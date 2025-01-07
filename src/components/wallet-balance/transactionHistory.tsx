/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/shadcn/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import React, { useRef } from "react";
import { InfiniteScroll } from "../wallete/infinite-scroll";
import { Skeleton } from "../shadcn/ui/skeleton";
import { useModal } from "~/lib/state/play/use-modal-store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RecentTransactionHistory } from "~/lib/stellar/walletBalance/acc";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { api } from "~/utils/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/shadcn/ui/tooltip"

const BatchLimit = 10;

function AddressWithTooltip({ address }: { address: string }) {
  const [shortAddr, fullAddr] = address.split("::")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{addrShort(shortAddr, 5)}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fullAddr ?? shortAddr}</p>
      </TooltipContent>
    </Tooltip>
  )
}


const TransactionHistory = () => {
  const { onOpen } = useModal();
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = api.walletBalance.wallBalance.getTransactionHistory.useInfiniteQuery(
    { limit: BatchLimit },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "error") {
    return <div>Error loading transactions</div>;
  }

  return (
    <div ref={parentRef} className="h-[calc(100vh-50vh)] md:h-[calc(100vh-40vh)] overflow-y-auto scrollbar-none">
      <InfiniteScroll
        parentRef={parentRef}
        dataLength={data?.pages.reduce((acc, page) => acc + page.items.length, 0) ?? 0}
        loadMore={loadMore}
        hasMore={!!hasNextPage}
        batchSize={BatchLimit}
        loader={<div className="p-4 text-center">Loading more transactions...</div>}
      >
        <TooltipProvider>
          <Table>
            <TableBody>
              {data?.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.items.map((transaction, j) => (


                    <TableRow key={j}
                      className={j % 2 === 1 ? "bg-green-50 hover:bg-red-100" : "bg-white hover:bg-red-100"}
                      onClick={() => onOpen("transaction history", { transaction: transaction })}
                    >
                      <TableCell >{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      {
                        transaction.operations.map((operation, k) => (

                          <TableCell key={k} className="flex flex-col  px-2 py-3">
                            {
                              operation.type === "payment" && (
                                (
                                  <div>
                                    <AddressWithTooltip address={operation.from} /> {" payment "} {operation.amount} {operation.asset_code ? operation.asset_code : "XLM"}
                                    {" to "}
                                    <AddressWithTooltip address={operation.to} />
                                  </div>

                                )
                              )
                            }
                            {
                              operation.type === "path_payment_strict_receive" && (
                                <div>
                                  <AddressWithTooltip address={operation.from} />
                                  path payment strict receive {operation.amount} {operation.asset_code} to
                                  <AddressWithTooltip address={operation.to} />
                                </div>
                              )
                            }
                            {
                              operation.type === "path_payment_strict_send" && (
                                <div>
                                  <AddressWithTooltip address={operation.from} />
                                  path payment strict send {operation.amount} {operation.asset_code} to
                                  <AddressWithTooltip address={operation.to} />
                                </div>
                              )
                            }

                            {
                              operation.type === "change_trust" && (
                                <>
                                  <div>
                                    <AddressWithTooltip address={operation.source_account} /> change trust to {operation.asset_code} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "allow_trust" && (
                                <>
                                  <div>{addrShort(operation.trustor, 5)} allow trust {operation.asset_code} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "set_options" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> set options </div>
                                </>
                              )
                            }
                            {
                              operation.type === "create_account" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> create an account {addrShort(operation.account)} with starting balance {operation.starting_balance} XLM </div>
                                </>
                              )
                            }

                            {
                              operation.type === "account_merge" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> merge account {addrShort(operation.into)} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "manage_data" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> set data {operation.name} to {addrShort(operation.value.toLocaleString(), 6)} </div>
                                </>
                              )
                            }

                            {
                              operation.type === "manage_sell_offer" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> manage sell offer {operation.offer_id} </div>
                                </>
                              )
                            }


                            {
                              operation.type === "create_passive_sell_offer" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> create passive sell offer {operation.offer_id} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "inflation" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> inflation </div>
                                </>
                              )
                            }
                            {
                              operation.type === "bump_sequence" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> bump sequence </div>
                                </>
                              )
                            }
                            {
                              operation.type === "create_claimable_balance" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> create claimable balance {operation.amount} {operation.asset.split(":")[0]} with {addrShort(operation.claimants[0]?.destination)} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "claim_claimable_balance" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> claim claimable balance  </div>
                                </>
                              )
                            }
                            {
                              operation.type === "begin_sponsoring_future_reserves" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> begin sponsoring future reserves </div>
                                </>
                              )
                            }
                            {
                              operation.type === "end_sponsoring_future_reserves" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> end sponsoring future reserves </div>
                                </>
                              )
                            }
                            {
                              operation.type === "revoke_sponsorship" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> revoke sponsorship </div>
                                </>
                              )
                            }
                            {
                              operation.type === "clawback" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> clawback {operation.amount} {operation.asset_code} from {addrShort(operation.from, 5)} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "clawback_claimable_balance" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> clawback claimable balance {operation.balance_id} </div>
                                </>
                              )
                            }
                            {
                              operation.type === "set_trust_line_flags" && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> set trust line flags {operation.asset_code} </div>
                                </>
                              )
                            }
                            {
                              operation.type === 'invoke_host_function' && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> invoke host function  </div>
                                </>
                              )
                            }
                            {
                              operation.type === 'bump_footprint_expiration' && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> bump footprint expiration  </div>
                                </>
                              )
                            }
                            {
                              operation.type === 'restore_footprint' && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> restore footprint  </div>
                                </>
                              )
                            }
                            {
                              operation.type === 'liquidity_pool_deposit' && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> liquidity pool deposit  </div>
                                </>
                              )
                            }
                            {
                              operation.type === 'liquidity_pool_withdraw' && (
                                <>
                                  <div><AddressWithTooltip address={operation.source_account} /> liquidity pool withdraw  </div>
                                </>
                              )
                            }

                          </TableCell>
                        ))
                      }
                    </TableRow>

                  ))}
                </React.Fragment>
              ))}
              {isFetchingNextPage && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </InfiniteScroll>
    </div >
  );
};

export default TransactionHistory;


function addrShort(addr: string | undefined, size = 7) {
  if (!addr) return ""

  if (addr.length >= 56) {

    return `${addr.substring(0, size)}...${addr.substring(
      addr.length - size,
      addr.length,
    )}`;
  }
  else {
    return addr
  }

}