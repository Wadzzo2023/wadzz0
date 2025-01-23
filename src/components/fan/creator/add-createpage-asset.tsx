import { Creator } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";

import { DialogOverlay } from "@radix-ui/react-dialog";
import RechargeLink from "~/components/marketplace/recharge/link";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import Alert from "../../ui/alert";
import CustomPageAssetFrom from "./page_asset/custom";
import NewPageAssetFrom from "./page_asset/new";

export default function AddCreatorPageAssetModal({
  creator,
}: {
  creator: Creator;
}) {
  const { platformAssetBalance } = useUserStellarAcc();

  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 2,
  });

  if (requiredToken.isLoading)
    return (
      <div className="flex items-center justify-center gap-2">
        <span> Fetching your page asset</span>
        <span className="loading loading-dots loading-sm"></span>
      </div>
    );

  if (requiredToken.data) {
    if (platformAssetBalance < requiredToken.data) {
      return (
        <>
          <Alert
            className="max-w-lg"
            type={"error"}
            content={`To create this page asset, you'll need ${requiredToken.data} ${PLATFORM_ASSET.code} for your Asset account.`}
          />
          <RechargeLink />
        </>
      );
    } else {
      return (
        <AddCreatorPageAssetModalFrom
          requiredToken={requiredToken.data}
          creator={creator}
        />
      );
    }
  }
}

function AddCreatorPageAssetModalFrom({
  requiredToken,
}: {
  creator: Creator;
  requiredToken: number;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add Page Asset
        </Button>
      </DialogTrigger>
      <DialogOverlay className=" bg-black/10 " />
      <DialogContent className="max-h-[700px] overflow-y-auto">
        <div className="">
          <h3 className="mb-4 text-center text-lg font-bold">
            Create Page Asset
          </h3>
          <Tabs defaultValue="new">
            <TabsList className="w-full">
              <TabsTrigger className="w-full" value="new">
                New
              </TabsTrigger>
              <TabsTrigger className="w-full" value="custom">
                Custom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <NewPageAssetFrom requiredToken={requiredToken} />
            </TabsContent>
            <TabsContent value="custom">
              <CustomPageAssetFrom requiredToken={requiredToken} />
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex w-full">
            <DialogClose asChild>
              <Button className="w-full" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
