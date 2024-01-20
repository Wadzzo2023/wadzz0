import React from "react";

import * as z from "zod";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import Tabs from "~/components/creator/tabs";
import { CreatorMenu, useCreator } from "~/lib/state/creator-menu";
import { PostMenu } from "~/components/creator/CreatPost";
import MemberShip from "~/components/creator/membership";
import About from "~/components/creator/about";

export const schema = z.object({
  content: z.string().min(1, { message: "Required" }),
});

export default function CreatorProfile() {
  const { data: session } = useSession();

  if (!session) return <div>LogIn First</div>;

  return <CreatorExist id={session.user.id} />;
}

function CreatorExist(props: { id: string }) {
  const { data, isLoading } = api.creator.getCreator.useQuery({
    id: props.id,
  });

  if (isLoading) return <div>Checking..</div>;
  if (data) {
    return <CreatorPageTemplate id={props.id} />;
  } else {
    return <CreateCreator id={props.id} />;
  }
}

function CreatorPageTemplate(props: { id: string }) {
  return (
    <div>
      <Tabs />
      <ConditionallyRenderMenuPage id={props.id} />
    </div>
  );
}

function ConditionallyRenderMenuPage(props: { id: string }) {
  const { selectedMenu } = useCreator();
  switch (selectedMenu) {
    case CreatorMenu.Posts:
      return <PostMenu id={props.id} />;
    case CreatorMenu.Membership:
      return <MemberShip />;
    case CreatorMenu.About:
      return <About />;
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
