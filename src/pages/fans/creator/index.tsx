import { Creator } from "@prisma/client";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import toast from "react-hot-toast";
import { PostMenu } from "~/components/fan/creator/CreatPost";
import MemberShip from "~/components/fan/creator/membership";
import Shop from "~/components/fan/creator/shop";
import Tabs from "~/components/fan/creator/tabs";
import Avater from "~/components/ui/avater";
import { CreatorMenu, useCreator } from "~/lib/state/fan/creator-menu";
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

  if (isLoading) return <div>Checking..</div>;
  if (creator) {
    return <CreatorPageTemplate creator={creator} />;
  } else {
    return <CreateCreator id={props.user.id} />;
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
          src={props.creator.coverUrl ?? ""}
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

function CreateCreator(props: { id: string }) {
  const { pubkey, needSign, walletType } = useConnectWalletStateStore();
  const makeCreatorMutation = api.fan.creator.makeMeCreator.useMutation();
  const xdr = api.fan.trx.createStorageAccount.useMutation({
    onSuccess: (data) => {
      const { xdr, storage } = data;
      clientsign({
        presignedxdr: xdr,
        pubkey,
        walletType,
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
        .catch((e) => console.log(e));
    },
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 ">
      <p className="text-2xl font-bold">You are not a creator</p>
      <button
        className="btn btn-primary"
        onClick={() => xdr.mutate(needSign())}
      >
        {makeCreatorMutation.isLoading && (
          <span className="loading loading-spinner" />
        )}
        Be a creator
      </button>
    </div>
  );
}
