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
import { useModal } from "~/lib/state/play/use-modal-store";

const BatchLimit = 10;

const TransactionHistory = () => {
  const { onOpen } = useModal();
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
              <TableBody>
                {transactions?.map((item, index) => (
                  <TableRow key={index} onClick={() => onOpen('transaction history', {
                    transaction: item
                  })}>
                    <TableCell>
                      {item?.parseDetails?.createdAt
                        ? new Date(item.parseDetails.createdAt).toLocaleString()
                        : ""}
                    </TableCell>
                    {item?.parseDetails?.type === "payment" ? (
                      <TableCell>
                        {item.parseDetails.source ?
                          addrShort(item.parseDetails.source, 5) : addrShort(item.fee_account)}{" "}
                        payment {item.parseDetails.amount}{" "}
                        {item.parseDetails.asset} to{" "}
                        {item.source_account &&
                          addrShort(item.source_account, 5)}
                      </TableCell>
                    ) : item?.parseDetails?.type === "createAccount" ? (
                      <TableCell>
                        {item.source_account &&
                          addrShort(item.source_account, 5)}{" "}
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
                        {item.source_account &&
                          addrShort(item.source_account, 5)}{" "}
                        claimed balance ID{" "}
                        {item.parseDetails.balanceId &&
                          addrShort(item.parseDetails.balanceId, 5)}
                      </TableCell>
                    ) : item?.parseDetails?.type === "changeTrust" ? (
                      <TableCell>
                        {item.source_account &&
                          addrShort(item.source_account, 5)}{" "}
                        changed trustline
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
