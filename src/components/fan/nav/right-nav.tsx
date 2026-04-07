import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { CreatorNavButtons } from "./creator-mode";
import { UserMode } from "./user-mode";
import { api } from "~/utils/api";

export default function RightContainer() {
  const { selectedMenu } = useMode();

  const creator = api.fan.creator.meCreator.useQuery();

  if (selectedMenu === Mode.User) return <UserMode />;

  if (selectedMenu === Mode.Creator)
    return (
      <div className=" flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  p-2">
        {creator.data && <CreatorNavButtons />}
      </div>
    );
}
