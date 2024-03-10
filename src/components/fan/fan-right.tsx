import { Profile } from "./nav/profile-menu";
import RightContainer from "./nav/right-nav";

export default function RightBar() {
  return (
    <div className="div h-full bg-base-100/80">
      <div className="my-2 flex w-full flex-row justify-center gap-1 px-4 ">
        <Profile />
      </div>

      <RightContainer />
    </div>
  );
}
