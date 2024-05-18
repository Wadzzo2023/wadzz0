import { api } from "~/utils/api";
import { Profile } from "./nav/profile-menu";
import RightContainer from "./nav/right-nav";
import { Mode, useMode } from "~/lib/state/fan/left-side-mode";

export default function RightBar() {
  const creator = api.fan.creator.meCreator.useQuery();
  const { selectedMenu } = useMode();

  return (
    <div className="div h-full bg-base-100/80">
      <div className="my-2 flex w-full flex-row justify-center gap-1 px-4 ">
        <Profile />
      </div>

      {(creator.data ?? selectedMenu == Mode.User) && <RightContainer />}
    </div>
  );
}
