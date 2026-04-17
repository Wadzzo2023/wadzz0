import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { CreatorNavButtons } from "./creator-mode";
import { UserMode } from "./user-mode";
import { Profile } from "./profile-menu";
import { api } from "~/utils/api";

export default function RightContainer() {
  const { selectedMenu } = useMode();

  const creator = api.fan.creator.meCreator.useQuery();

  if (selectedMenu === Mode.User)
    return (
      <div className="flex flex-1 flex-col gap-2 overflow-auto rounded-lg p-2">
        <Profile />
        <UserMode />
      </div>
    );

  if (selectedMenu === Mode.Creator)
    return (
      <div className=" flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  p-2">
        <Profile />
        {creator.data && <CreatorNavButtons />}
      </div>
    );
}
