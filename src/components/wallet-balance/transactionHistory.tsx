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
import { addrShort, delay } from "~/utils/utils";
import { Skeleton } from "../shadcn/ui/skeleton";
import { useModal } from "~/lib/state/play/use-modal-store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RecentTransactionHistory } from "~/lib/stellar/walletBalance/acc";
import { useSession } from "next-auth/react";

const BatchLimit = 10;

const TransactionHistory = () => {
  const { onOpen } = useModal();
  const session = useSession();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    ['recentTransactionHistory', session.data?.user?.id],
    async ({ pageParam = "" }) => {
      await delay(1000); // Simulated delay for smoother UX
      return await RecentTransactionHistory({
        userPubKey: session.data?.user?.id ?? "",
        input: {
          limit: BatchLimit,
          cursor: pageParam,
        },
      });
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor, // Use nextCursor to load more
    }
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  console.log("transactions", data); // Verify transactions length and cursor logic



  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={parentRef} style={{ height: "450px", overflow: "auto" }}>
          <InfiniteScroll
            parentRef={parentRef}
            dataLength={data?.pages.reduce((acc, page) => acc + page.items.length, 0) ?? 0}
            loadMore={loadMore}
            hasMore={!!hasNextPage}
            batchSize={BatchLimit}
            loader={<div className="loading">Loading...</div>}
          >
            <Table>
              <TableBody>
                {data?.pages.map((page, i) => (
                  <React.Fragment key={i}>
                    {page.items.map((transaction, j) => (


                      <TableRow key={j}
                        onClick={() => onOpen("transaction history", { transaction: transaction })}
                      >
                        {
                          transaction.operations.map((operation, k) => (
                            <TableCell key={k} className="flex flex-col  px-2 py-3">
                              {
                                operation.type === "payment" && (
                                  (
                                    <>
                                      <div>{addrShort(operation.from, 5)} payment {operation.amount} {operation.asset_code ? operation.asset_code : "XLM"} to {addrShort(operation.to, 5)} </div>

                                    </>

                                  )
                                )
                              }
                              {
                                operation.type === "path_payment_strict_receive" && (
                                  <>
                                    <div>{addrShort(operation.from, 5)} path payment strict receive {operation.amount} {operation.asset_code} to {addrShort(operation.to, 5)} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "path_payment_strict_send" && (
                                  <>
                                    <div>{addrShort(operation.from, 5)} path payment strict send {operation.amount} {operation.asset_code} to {addrShort(operation.to, 5)} </div>
                                  </>
                                )
                              }

                              {
                                operation.type === "change_trust" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} change trust to {operation.asset_code} </div>
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
                                    <div>{addrShort(operation.source_account, 5)} set options </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "create_account" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} create an account {addrShort(operation.account)} with starting balance {operation.starting_balance} XLM </div>
                                  </>
                                )
                              }

                              {
                                operation.type === "account_merge" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} merge account {addrShort(operation.into)} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "manage_data" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} set data {operation.name} to {operation.value} </div>
                                  </>
                                )
                              }

                              {
                                operation.type === "manage_sell_offer" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} manage sell offer {operation.offer_id} </div>
                                  </>
                                )
                              }


                              {
                                operation.type === "create_passive_sell_offer" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} create passive sell offer {operation.offer_id} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "inflation" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} inflation </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "bump_sequence" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} bump sequence </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "create_claimable_balance" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} create claimable balance {operation.amount} {operation.asset.split(":")[0]} with {addrShort(operation.claimants[0]?.destination!)} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "claim_claimable_balance" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} claim claimable balance  </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "begin_sponsoring_future_reserves" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} begin sponsoring future reserves </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "end_sponsoring_future_reserves" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} end sponsoring future reserves </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "revoke_sponsorship" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} revoke sponsorship </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "clawback" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} clawback {operation.amount} {operation.asset_code} from {addrShort(operation.from, 5)} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "clawback_claimable_balance" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} clawback claimable balance {operation.balance_id} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === "set_trust_line_flags" && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} set trust line flags {operation.asset_code} </div>
                                  </>
                                )
                              }
                              {
                                operation.type === 'invoke_host_function' && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} invoke host function  </div>
                                  </>
                                )
                              }
                              {
                                operation.type === 'bump_footprint_expiration' && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} bump footprint expiration  </div>
                                  </>
                                )
                              }
                              {
                                operation.type === 'restore_footprint' && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} restore footprint  </div>
                                  </>
                                )
                              }
                              {
                                operation.type === 'liquidity_pool_deposit' && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} liquidity pool deposit  </div>
                                  </>
                                )
                              }
                              {
                                operation.type === 'liquidity_pool_withdraw' && (
                                  <>
                                    <div>{addrShort(operation.source_account, 5)} liquidity pool withdraw  </div>
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
          </InfiniteScroll>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;


