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
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";

import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";

export default function WBRightSideBar() {
  const { data, isLoading } =
    api.walletBalance.wallBalance.getWalletsBalance.useQuery();
  if (isLoading || !data) return <div>Loading...</div>;
  console.log("data", data);
  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Add Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Label htmlFor="search" className="sr-only">
              Link
            </Label>
            <Input
              placeholder="find assets..."
              id="search"
              value={""}
              onChange={(e) => {
                e.target.value;
              }}
            />
            <Button variant="secondary" className="shrink-0">
              Search
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">My Assets</h4>
            <div className="grid gap-6">
              {data?.map((balance, idx) => {
                if (balance?.asset_type !== "native") {
                  return (
                    <div
                      key={idx}
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
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
