import { useRouter } from "next/router";
import React from "react";
import { PostCard } from "~/components/creator/CreatPost";
import { api } from "~/utils/api";
import { CreatorBack } from "../me/creator";
import { Creator } from "@prisma/client";
import MemberShip from "~/components/creator/membership";
import MemberShipCard from "~/components/creator/card";
import AddTierModal from "~/components/creator/add-tier-modal";
import { useSession } from "next-auth/react";

export default function CreatorPage() {
  const router = useRouter();
  const creatorId = router.query.id;

  if (typeof creatorId == "string" && creatorId.length === 56) {
    return <Page creatorId={creatorId} />;
  }

  return <div>Error</div>;
}

function Page({ creatorId }: { creatorId: string }) {
  const { data, isLoading, error } = api.post.getPosts.useQuery({
    pubkey: creatorId,
  });
  const { data: creator } = api.creator.getCreator.useQuery({ id: creatorId });
  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  if (data)
    return (
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center ">
          {creator && (
            <>
              <CreatorBack creator={creator} />
              <ChooseMemberShip creator={creator} />
            </>
          )}
          {data.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.map((el) => (
                <PostCard post={el} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
}

function ChooseMemberShip({ creator }: { creator: Creator }) {
  const { data: sessionData } = useSession();

  const { data: subscriptonModel, isLoading } =
    api.member.getAllMembership.useQuery(creator.id);
  const subscribe = api.member.subscribe.useMutation();

  const { data: subscriptions } = api.member.userSubscriptions.useQuery(
    sessionData?.user.id!,
  );

  return (
    <div className="mb-10 flex flex-col gap-4">
      <h2
        className="text-center text-2xl font-bold
      "
      >
        Choose your Membership
      </h2>
      {isLoading && <div>Loading...</div>}
      <div className="flex gap-2">
        {subscriptonModel?.map((el) => (
          <MemberShipCard
            className="w-48 bg-neutral text-neutral-content"
            key={el.id}
            creator={creator}
            subscription={el}
          >
            {/* <div className="card-actions justify-end"> */}
            <button
              className="btn btn-primary"
              disabled={subscriptions?.some(
                (sub) => sub.subscriptionId === el.id,
              )}
              onClick={() =>
                subscribe.mutate({
                  id: sessionData?.user.id ?? "nill",
                  subscriptionId: el.id,
                })
              }
            >
              {subscribe.isLoading ? "Loading..." : "Subscribe"}
            </button>
            {/* </div> */}
            {/* </div> */}
          </MemberShipCard>
        ))}
      </div>
    </div>
  );
}
