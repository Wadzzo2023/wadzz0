import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { CreatorNavButtons } from "./creator-mode";
import { AllCreators, UserMode } from "./user-mode";

export default function RightContainer() {
  const { selectedMenu, toggleSelectedMenu } = useMode();

  if (selectedMenu === Mode.User) return <UserMode />;

  if (selectedMenu === Mode.Creator)
    return (
      <div className=" flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  p-2">
        <CreatorNavButtons />
      </div>
    );
}
