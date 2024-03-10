import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { CreatorNavButtons } from "./creator-mode";
import { AllCreators } from "./user-mode";

export default function RightContainer() {
  const { selectedMenu, toggleSelectedMenu } = useMode();

  if (selectedMenu === Mode.User)
    return (
      <div className="m-2 flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  bg-base-200 p-2">
        <AllCreators />
      </div>
    );

  if (selectedMenu === Mode.Creator)
    return (
      <div className="m-2 flex flex-1 flex-col gap-2 overflow-auto  rounded-lg  p-2">
        <CreatorNavButtons />
      </div>
    );
}
