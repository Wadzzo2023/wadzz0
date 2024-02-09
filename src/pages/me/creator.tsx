import React from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { type Session } from "next-auth";
import Tabs from "~/components/creator/tabs";
import { CreatorMenu, useCreator } from "~/lib/state/creator-menu";
import { PostMenu } from "~/components/creator/CreatPost";
import MemberShip from "~/components/creator/membership";
import About from "~/components/creator/about";
import Avater from "~/components/ui/avater";
import { Creator } from "@prisma/client";
import Shop from "~/components/creator/shop";
import { Edit } from "lucide-react";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import { useRouter } from "next/router";

export default function CreatorProfile() {
  const { data: session } = useSession();

  if (!session) return <div>LogIn First</div>;

  return <CreatorExist user={session.user} />;
}

function CreatorExist(props: { user: Session["user"] }) {
  const { data: creator, isLoading } = api.creator.getCreator.useQuery({
    id: props.user.id,
  });

  if (isLoading) return <div>Checking..</div>;
  if (creator) {
    return <CreatorPageTemplate creator={creator} />;
  } else {
    return <CreateCreator id={props.user.id} />;
  }
}

function CreatorPageTemplate(props: { creator: Creator }) {
  return (
    <div className="flex h-screen flex-col items-center ">
      <CreatorBack creator={props.creator} />
      <div className=" mb-6 w-3/4 bg-base-300">
        <Tabs />
      </div>
      <ConditionallyRenderMenuPage creator={props.creator} />
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
  const makeCreatorMutation = api.creator.makeMeCreator.useMutation();

  return (
    <div>
      <p>You are not a creator</p>
      <button onClick={() => makeCreatorMutation.mutate({ id: props.id })}>
        Be a creator
      </button>
    </div>
  );
}
