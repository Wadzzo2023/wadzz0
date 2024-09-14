import { Creator } from "@prisma/client";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign } from "package/connect_wallet";
import { useState } from "react";
import toast from "react-hot-toast";
import { PostMenu } from "~/components/fan/creator/CreatPost";
import MemberShip from "~/components/fan/creator/membership";
import CreatorsTabs from "~/components/fan/creator/tabs";
import RechargeLink from "~/components/marketplace/recharge/link";
import Alert from "~/components/ui/alert";
import Avater from "~/components/ui/avater";
import Loading from "~/components/wallete/loading";
import useNeedSign from "~/lib/hook";
import { CreatorMenu, useCreator } from "~/lib/state/fan/creator-menu";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
} from "~/lib/stellar/constant";

export default function CreatorProfile() {
  const { data: session } = useSession();

  if (!session) return <div>LogIn First</div>;

  return <CreatorExist user={session.user} />;
}

function CreatorExist(props: { user: Session["user"] }) {
  const { data: creator, isLoading } = api.fan.creator.getCreator.useQuery(
    {
      id: props.user.id,
    },
    { refetchOnWindowFocus: false },
  );

  if (isLoading) return <Loading />;
  if (creator) {
    return <CreatorPageTemplate creator={creator} />;
  } else {
    return <ValidCreateCreator />;
  }
}

function CreatorPageTemplate(props: { creator: Creator }) {
  return (
    <div className="flex h-screen flex-col items-center">
      <CreatorBack creator={props.creator} />
      <div className="w-1/2">
        <CreatorsTabs />
      </div>
      <div className="w-full">
        <ConditionallyRenderMenuPage creator={props.creator} />
      </div>
    </div>
  );
}

export function CreatorBack(props: { creator: Creator }) {
  return (
    <div className="w-full">
      <div className="relative h-40  w-full bg-blue-200">
        <Image
          src={props.creator.coverUrl ?? "/images/icons/bg.png"}
          layout="fill"
          objectFit="cover"
          alt="cover"
        />
      </div>
      <div className="mb-5 flex flex-col items-center justify-center">
        <div className=" -mt-16 flex h-40 w-40 items-center justify-center rounded-full ">
          <Avater url={props.creator.profileUrl} className=" h-40 w-40" />
        </div>

        <div className="flex max-w-md flex-col items-center ">
          <h1 className="text-2xl font-bold">{props.creator.name}</h1>
          {/* <p className="text-center leading-snug">{props.creator.bio}</p> */}
        </div>
      </div>
    </div>
  );
}

function ConditionallyRenderMenuPage({ creator }: { creator: Creator }) {
  const { selectedMenu } = useCreator();
  switch (selectedMenu) {
    case CreatorMenu.Posts:
      return <PostMenu id={creator.id} />;
    case CreatorMenu.Membership:
      return <MemberShip creator={creator} />;

    // case CreatorMenu.Shop:
    //   return <Shop creator={creator} />;
  }
}

export function ValidCreateCreator({ message }: { message?: string }) {
  const { platformAssetBalance } = useUserStellarAcc();
  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 5,
  });

  if (requiredToken.isLoading) return <Loading />;

  // if (!platformAssetBalance) return <div>Check your Account</div>;

  if (requiredToken.data) {
    const requiredTokenNumber = requiredToken.data;
    if (platformAssetBalance >= requiredTokenNumber) {
      return <CreateCreator requiredToken={requiredTokenNumber} />;
    } else {
      return (
        <div className="flex h-full w-full flex-col items-center  justify-center gap-2">
          {message && (
            <Alert className="max-w-xl" content={message} type="info" />
          )}
          <Alert
            className="max-w-xl"
            type="error"
            content={`You don't have Sufficient Balance ,To create storage account, you need minimum ${requiredToken.data} ${PLATFORM_ASSET.code} `}
          />
          <RechargeLink />
        </div>
      );
    }
  }
}

function CreateCreator({ requiredToken }: { requiredToken: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { needSign } = useNeedSign();

  const session = useSession();
  const makeCreatorMutation = api.fan.creator.makeMeCreator.useMutation();
  const [signLoading, setSingLoading] = useState(false);

  const xdr = api.fan.trx.createStorageAccount.useMutation({
    onSuccess: (data) => {
      const { xdr, storage } = data;
      setSingLoading(true);

      const toastId = toast.loading("Creating account");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id,
        walletType: session.data?.user.walletType,
        test: clientSelect(),
      })
        .then((isSucces) => {
          if (isSucces) {
            toast.success("You are now a creator");
            makeCreatorMutation.mutate(storage);
          } else {
            toast.error("Failed to create account");
          }
        })
        .catch((e) => console.log(e))
        .finally(() => {
          toast.dismiss(toastId);
          setSingLoading(false);
          setIsOpen(false);
        });
    },
  });

  const loading = xdr.isLoading || makeCreatorMutation.isLoading || signLoading;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 ">
      <p className="text-2xl font-bold">You are not a {CREATOR_TERM}</p>
      <p className="alert alert-info max-w-xl text-center">
        Your account will be charged {requiredToken} {PLATFORM_ASSET.code} to be
        a brand.
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="btn btn-primary">Join as a brand</button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div>
            Your account will be charged {requiredToken}{" "}
            <span className="text-red-600">{PLATFORM_ASSET.code}</span> to be a
            brand.
          </div>
          <DialogFooter className=" w-full">
            <div className="flex w-full gap-4  ">
              <DialogClose className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                type="submit"
                onClick={() => xdr.mutate(needSign())}
                disabled={loading}
                className="w-full"
              >
                {loading && <span className="loading loading-spinner" />}
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
