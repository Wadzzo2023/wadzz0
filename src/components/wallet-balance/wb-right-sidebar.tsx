"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";

import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import AddTrustLine from "./add-trustline";
import { type WalletType, clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import PendingAssetList from "./pending-asset";

export default function WBRightSideBar() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  if (!session) return null;
  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="asset">
          <TabsList className="w-full">
            <TabsTrigger className="w-full" value="asset">
              My Asset
            </TabsTrigger>
            <TabsTrigger className="w-full" value="pending">
              Pending Asset
            </TabsTrigger>
          </TabsList>
          <TabsContent value="asset">
            <MyAssetList />
          </TabsContent>
          <TabsContent value="pending">
            <PendingAssetList
              user={session?.user}
              setLoading={setLoading}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

const MyAssetList = () => {
  const { data, isLoading } =
    api.walletBalance.wallBalance.getWalletsBalance.useQuery();
  if (isLoading) return <div>Loading...</div>;
  console.log("data", data);
  return (
    <>
      <Separator className="my-4" />
      <div className="space-y-4">
        <div className="grid gap-6">
          {!data || data.length === 0 ? (
            <h1>No Assets Available</h1>
          ) : (
            data?.map((balance, idx) => {
              if (balance?.asset_type !== "native") {
                return (
                  <div
                    key={`${balance?.asset_code}-${idx}`}
                    className="flex items-center justify-between space-x-4"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="/avatars/05.png" alt="Image" />
                        <AvatarFallback>
                          {balance?.asset_code
                            .toString()
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {balance?.asset_code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {balance?.home_domain && (
                            <span className="text-muted-foreground">
                              {balance?.home_domain}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h1 className="shrink-0">{balance?.balance}</h1>
                    </div>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </div>
    </>
  );
};
