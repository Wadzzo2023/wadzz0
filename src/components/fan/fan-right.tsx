import { useRouter } from "next/router";
import React from "react";
import { CreatorAvater } from "~/pages/search";
import { api } from "~/utils/api";

import { Search } from "lucide-react";
import Link from "next/link";
import { Profile } from "./profile-menu";
import { AllCreators } from "./nav/user-mode";
import RightContainer from "./nav/right-nav";

export default function RightBar() {
  return (
    <div className="hidden h-full w-80  flex-col bg-base-100/80  lg:flex">
      <div className="my-2 flex w-full flex-row justify-center gap-1 px-4 ">
        <Profile />
      </div>

      <RightContainer />
    </div>
  );
}
