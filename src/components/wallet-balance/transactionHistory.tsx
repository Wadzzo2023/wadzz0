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
import { api } from "~/utils/api";
import { useRef } from "react";
import { InfiniteScroll } from "../wallete/infinite-scroll";
import { addrShort, delay } from "~/utils/utils";
import { Skeleton } from "../shadcn/ui/skeleton";

const BatchLimit = 10;

const TransactionHistory = () => {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.walletBalance.wallBalance.getTransactionHistory.useInfiniteQuery(
      {
        limit: BatchLimit,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const transactions = data?.pages.flatMap((page) => page.items) ?? [];
  const parentRef = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  console.log("transactions", transactions); // Verify the transactions length and data here
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={parentRef} style={{ height: "450px", overflow: "auto" }}>
          <InfiniteScroll
            parentRef={parentRef}
            dataLength={transactions.length}
            loadMore={loadMore}
            hasMore={!!hasNextPage}
            batchSize={BatchLimit}
            loader={<div className="loading">Loading...</div>}
          >
            <Table>
              <TableBody>
                {transactions?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {item?.parseDetails?.createdAt
                        ? new Date(item.parseDetails.createdAt).toLocaleString()
                        : ""}
                    </TableCell>
                    {item?.parseDetails?.type === "payment" ? (
                      <TableCell>
                        {item.parseDetails.source &&
                          addrShort(item.parseDetails.source, 5)}{" "}
                        payment {item.parseDetails.amount}{" "}
                        {item.parseDetails.asset} to{" "}
                        {item.parseDetails.destination &&
                          addrShort(item.parseDetails.destination, 5)}
                      </TableCell>
                    ) : item?.parseDetails?.type === "createAccount" ? (
                      <TableCell>
                        {item.parseDetails.source &&
                          addrShort(item.parseDetails.source, 5)}{" "}
                        created an account with{" "}
                        {item.parseDetails.startingBalance} XLM
                      </TableCell>
                    ) : item?.parseDetails?.type ===
                      "createClaimableBalance" ? (
                      <TableCell>
                        {item.parseDetails.claimantOne &&
                          addrShort(item.parseDetails.claimantOne, 5)}{" "}
                        created a claimable balance of{" "}
                        {item.parseDetails.amount} {item.parseDetails.code} with{" "}
                        {item.parseDetails.claimantZero &&
                          addrShort(item.parseDetails.claimantZero, 5)}
                      </TableCell>
                    ) : item?.parseDetails?.type === "claimClaimableBalance" ? (
                      <TableCell>
                        {item.parseDetails.source &&
                          addrShort(item.parseDetails.source, 5)}{" "}
                        claimed balance ID{" "}
                        {item.parseDetails.balanceId &&
                          addrShort(item.parseDetails.balanceId, 5)}
                      </TableCell>
                    ) : (
                      <TableCell>{item?.parseDetails?.type}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </InfiniteScroll>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
