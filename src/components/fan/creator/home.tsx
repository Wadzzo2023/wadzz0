import { Creator } from "@prisma/client";
import React from "react";
import { ChooseMemberShip } from "~/pages/fans/creator/[id]";

function CreatorHomeTabPage({ creator }: { creator: Creator }) {
  return (
    <div>
      <ChooseMemberShip creator={creator} />
    </div>
  );
}

export default CreatorHomeTabPage;
