import { Creator } from "@prisma/client";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { WalletType, clientsign } from "package/connect_wallet";
import { useState } from "react";
import toast from "react-hot-toast";
import { PostMenu } from "~/components/fan/creator/CreatPost";
import MemberShip from "~/components/fan/creator/membership";
import Shop from "~/components/fan/creator/shop";
import Tabs from "~/components/fan/creator/tabs";
import Alert from "~/components/ui/alert";
import Avater from "~/components/ui/avater";
import Loading from "~/components/wallete/loading";
import useNeedSign from "~/lib/hook";
import { CreatorMenu, useCreator } from "~/lib/state/fan/creator-menu";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFROM_ASSET, PLATFROM_FEE } from "~/lib/stellar/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";

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
      <div className=" mb-6 w-3/4  p-2">
        <Tabs />
      </div>
      <div className="pb-32">
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
        <div className="bg-whit z-50 -mt-16 flex h-36 w-36 items-center justify-center rounded-full">
          <Avater url={props.creator.profileUrl} className="w-28" />
        </div>

        <div className="flex max-w-md flex-col items-center ">
          <h1 className="text-2xl font-bold">{props.creator.name}</h1>
          <p className="text-center leading-snug">{props.creator.bio}</p>
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

    case CreatorMenu.Shop:
      return <Shop creator={creator} />;
  }
}

function ValidCreateCreator() {
  const { platformAssetBalance } = useUserStellarAcc();
  const requiredToken = api.fan.trx.getPlatformTokenPriceForXLM.useQuery({
    xlm: 5,
  });

  if (requiredToken.isLoading) return <Loading />;

  // if (!platformAssetBalance) return <div>Check your Account</div>;

  if (requiredToken.data) {
    const requiredTokenNumber = requiredToken.data + Number(PLATFROM_FEE);
    if (platformAssetBalance >= requiredTokenNumber) {
      return <CreateCreator requiredToken={requiredTokenNumber} />;
    } else {
      return (
        <div className="flex h-full w-full  items-center justify-center">
          <Alert
            className="max-w-xl"
            type="error"
            content={`To be a creator, you need minimum ${requiredToken.data} ${PLATFROM_ASSET.code} `}
          />
        </div>
      );
    }
  }
}

function CreateCreator({ requiredToken }: { requiredToken: number }) {
  const { needSign } = useNeedSign();
  const session = useSession();
  const makeCreatorMutation = api.fan.creator.makeMeCreator.useMutation();
  const [signLoading, setSingLoading] = useState(false);

  const xdr = api.fan.trx.createStorageAccount.useMutation({
    onSuccess: (data) => {
      const { xdr, storage } = data;
      console.log(xdr, storage);
      setSingLoading(true);

      toast(xdr);
      const toastId = toast.loading("Creating account");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id ?? "",
        walletType: session.data?.user.walletType ?? WalletType.none,
        test: clientSelect(),
      })
        .then((isSucces) => {
          if (isSucces) {
            toast.success("You are now a creator", { id: toastId });
            makeCreatorMutation.mutate(storage);
          } else {
            toast.error("Failed to create account", { id: toastId });
          }
        })
        .catch((e) => console.log(e))
        .finally(() => {
          toast.dismiss(toastId);
          setSingLoading(false);
        });
    },
  });

  // if (requiredToken.isLoading) return <div>Checking required Action...</div>;

  const loading = xdr.isLoading || makeCreatorMutation.isLoading || signLoading;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 ">
      <p className="text-2xl font-bold">You are not a creator</p>
      <p className="alert-info">
        Your account should have minimum {requiredToken} ${PLATFROM_ASSET.code}{" "}
        to be a creator.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => xdr.mutate(needSign())}
        disabled={loading}
      >
        {loading && <span className="loading loading-spinner" />}
        Be a creator
      </button>
    </div>
  );
}
