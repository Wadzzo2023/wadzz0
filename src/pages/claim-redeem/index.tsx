"use client";

import { useState } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/shadcn/ui/card";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/shadcn/ui/table";
import useNeedSign from "~/lib/hook";
import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
import { clientSelect } from "~/lib/stellar/fan/utils";

const ClaimPage = () => {
  const [redeemCode, setRedeemCode] = useState("");
  const { needSign } = useNeedSign();
  const session = useSession();
  const [loading, setLoading] = useState(false);

  const claimMutation = api.fan.user.claimReward.useMutation({
    onSuccess: () => {
      toast.success("Reward claimed successfully");
      setRedeemCode("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const GetClaimRewardXDR = api.fan.user.getClaimRewardXDR.useMutation({
    onSuccess: async (data, variables) => {
      if (data) {
        try {
          const clientResponse = await clientsign({
            presignedxdr: data,
            walletType: session.data?.user?.walletType,
            pubkey: session.data?.user.id,
            test: clientSelect(),
          });

          if (clientResponse) {
            toast.success("Transaction successful");
            claimMutation.mutate({
              code: variables.code,
            });
          } else {
            toast.error("Transaction failed");
          }
        } catch (signError) {
          if (signError instanceof Error) {
            toast.error(`Error: ${signError.message}`);
          } else {
            toast.error("Something went wrong.");
          }
        } finally {
          setLoading(false);
        }
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (redeemCode.trim()) {
      GetClaimRewardXDR.mutate({
        code: redeemCode,

        signWith: needSign(),
      });
    }
  };
  const claimHistory = api.fan.user.getClaimHistory.useQuery();

  return (
    <div className="container mx-auto h-screen bg-base-200 px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Reward Claims</h1>
      <Tabs defaultValue="redeem" className="mx-auto w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="redeem">Redeem Code</TabsTrigger>
          <TabsTrigger value="history">Claim History</TabsTrigger>
        </TabsList>
        <TabsContent value="redeem">
          <Card>
            <CardHeader>
              <CardTitle>Claim Your Reward</CardTitle>
              <CardDescription>
                Enter your redeem code to claim your reward
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Input
                      id="redeemCode"
                      placeholder="Enter your redeem code"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={claimMutation.isLoading}
                >
                  {loading && (
                    <div role="status">
                      <svg
                        aria-hidden="true"
                        className="mr-2 h-4 w-4 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                      <span className="sr-only">Loading...</span>
                    </div>
                  )}
                  Claim Reward
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your Claim History</CardTitle>
              <CardDescription>
                View all the rewards you{"'ve"} claimed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimHistory.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : claimHistory.data && claimHistory.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Id</TableHead>
                      <TableHead>Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claimHistory.data.map((claim, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{claim.assetRedeemId}</TableCell>
                        <TableCell>{claim.code}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>You haven{"'t"} claimed any rewards yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClaimPage;
