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

import { Coins, DollarSign, Loader, User } from "lucide-react";
import { Label } from "~/components/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/shadcn/ui/radio-group";

import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { PaymentMethod, PaymentMethodEnum } from "~/components/BuyItem";
import CreateBrandButton from "~/components/fan/creator/onboarding/create-button";

export default function CreatorProfile() {
  return <CreatorExist />;
}

function CreatorExist() {
  const { data: creator, isLoading } = api.fan.creator.getMeCreator.useQuery(
    undefined,
    { refetchOnWindowFocus: false },
  );

  if (isLoading) return <Loading />;
  if (creator) {
    if (creator.approved === null) {
      if (creator.aprovalSend) {
        return (
          <div className="flex h-screen w-full flex-col items-center justify-center gap-2 ">
            <p>Approval sent to the admin</p>
            <CreateBrandButton edit creator={creator} />
          </div>
        );
      } else {
        // this case is when already creator is created , with just storage acc for secondary market send.
        return <CreateBrandButton creator={creator} />;
      }
    } else if (creator.approved) {
      return <CreatorPageTemplate creator={creator} />;
    } else {
      // here approval is false, means banned
      return <p>You are banned. Contact to admin</p>;
    }
  } else {
    return <CreateBrandButton />;
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
  const { platformAssetBalance, getXLMBalance } = useUserStellarAcc();
  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 1,
  });

  const xlmBalance = getXLMBalance() ?? "0";

  if (requiredToken.isLoading) return <Loading />;

  // if (!platformAssetBalance) return <div>Check your Account</div>;

  if (requiredToken.data) {
    const requiredTokenNumber = requiredToken.data;
    if (
      platformAssetBalance >= requiredTokenNumber ||
      Number(xlmBalance) >= 1
    ) {
      return <CreateCreator requiredToken={requiredTokenNumber} />;
    } else {
      return (
        <div className="flex w-full flex-col items-center justify-center  gap-2 ">
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

// now only using this while creating storage account for secondary market
function CreateCreator({ requiredToken }: { requiredToken: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { needSign } = useNeedSign();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethodEnum.enum.asset,
  );

  const session = useSession();
  const makeCreatorMutation = api.fan.creator.makeMeCreator.useMutation({
    onSuccess: () => {
      toast.success("You have successfully created storage account");
      setIsOpen(false);
    },
  });
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
            makeCreatorMutation.mutate(storage);
          } else {
            toast.error("Failed to create account");
          }
        })
        .catch((e) => console.log(e))
        .finally(() => {
          setIsOpen(false);
          toast.dismiss(toastId);
          setSingLoading(false);
        });
    },
  });

  const handleConfirm = () => {
    xdr.mutate({
      signWith: needSign(),
      native: paymentMethod === PaymentMethodEnum.enum.xlm,
    });
  };

  const XLM_EQUIVALENT = 3;

  const loading = xdr.isLoading || makeCreatorMutation.isLoading || signLoading;

  return (
    <div className="flex  flex-col items-center justify-center gap-4 bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* <h2 className="mb-4 text-center text-2xl font-bold">
          You are not a {CREATOR_TERM}
        </h2> */}
        <p className="mb-6 text-center text-gray-600">
          Your account will be charged {requiredToken} {PLATFORM_ASSET.code} or
          equivalent XLM to create storage account
        </p>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              {loading && <Loader className="animate mr-2 animate-spin" />}
              {/* Join as a {CREATOR_TERM.toLowerCase()} */}
              Create Storage Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="mb-4 text-center text-2xl font-bold">
                Choose Payment Method
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(e) => setPaymentMethod(e as PaymentMethod)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                  <RadioGroupItem
                    value={PaymentMethodEnum.enum.asset}
                    id={PaymentMethodEnum.enum.asset}
                    className="border-primary"
                    // disabled
                  />
                  <Label
                    htmlFor={PLATFORM_ASSET.code}
                    className="flex flex-1 cursor-pointer items-center"
                  >
                    <Coins className="mr-3 h-6 w-6 text-primary" />
                    <div className="flex-grow">
                      <div className="font-medium">
                        Pay with {PLATFORM_ASSET.code.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Use platform tokens
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {requiredToken} {PLATFORM_ASSET.code.toUpperCase()}
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                  <RadioGroupItem
                    value={PaymentMethodEnum.enum.xlm}
                    id={PaymentMethodEnum.enum.xlm}
                    className="border-primary"
                  />
                  <Label
                    htmlFor={PaymentMethodEnum.enum.xlm}
                    className="flex flex-1 cursor-pointer items-center"
                  >
                    <DollarSign className="mr-3 h-6 w-6 text-primary" />
                    <div className="flex-grow">
                      <div className="font-medium">Pay with XLM</div>
                      <div className="text-sm text-gray-500">
                        Use Stellar Lumens
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {XLM_EQUIVALENT} XLM
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Your account will be charged{" "}
              {paymentMethod == PaymentMethodEnum.enum.asset
                ? `${requiredToken} ${PLATFORM_ASSET.code}`
                : `${XLM_EQUIVALENT} XLM`}{" "}
              {/* to be a {CREATOR_TERM.toLowerCase()}. */}
              to create storage account
            </div>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="mb-2 w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
