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

const BatchLimit = 10;

const TransactionHistory = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
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
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    {/* <TableCell>{item.memo || "No Description"}</TableCell>
                    <TableCell className="font-sm flex items-center">
                      {item.amount}
                    </TableCell> */}
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
