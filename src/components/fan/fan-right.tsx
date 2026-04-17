import RightContainer from "./nav/right-nav";
import { CreatorNavButtons } from "./nav/creator-mode";
import { Profile } from "./nav/profile-menu";
import { api } from "~/utils/api";

export default function RightBar() {
  return (
    <div className="div h-full ">
      <RightContainer />
    </div>
  );
}

export function CreatorOnlyRightBar() {
  const creator = api.fan.creator.meCreator.useQuery();

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-auto rounded-lg p-2">
      <Profile />
      {creator.data && <CreatorNavButtons />}
    </div>
  );
}
