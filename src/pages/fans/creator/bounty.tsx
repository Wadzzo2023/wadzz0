import clsx from "clsx";
import React from "react";
import { CreatPost, PostList } from "~/components/fan/creator/CreatPost";
import { api } from "~/utils/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";
import {
  BountyTabMenu,
  useBountyTabState,
} from "~/lib/state/bounty/bounty-tab-store";
import CreateBounty from "~/components/fan/creator/bounty/CreateBounty";
import BountyList from "~/components/fan/creator/bounty/BountyList";

export default function CreatorsPost() {
  const creator = api.fan.creator.meCreator.useQuery();
  if (creator.data)
    return (
      <div className="h-screen p-0 md:p-5">
        <h2 className="mb-5 text-center text-2xl font-bold">Bounty</h2>

        <div className=" flex w-full flex-col items-center justify-center">
          <CreateTabs />
          <div className="mb-20 mt-10 flex w-full items-center">
            <RenderTabs />
          </div>
        </div>
      </div>
    );
}

function RenderTabs() {
  const { setSelectedMenu, selectedMenu } = useBountyTabState();
  switch (selectedMenu) {
    case BountyTabMenu.Bounty:
      return <CreateBounty />;
    case BountyTabMenu.BountyList:
      return (
        <div className="w-full">
          <BountyList />
        </div>
      );
  }
}

function Posts() {
  const creator = api.fan.creator.meCreator.useQuery();
  if (creator.data) {
    return <PostList id={creator.data.id} />;
  }
}

function CreateTabs() {
  const { selectedMenu, setSelectedMenu } = useBountyTabState();
  const menuItems = Object.values(BountyTabMenu);
  const gridColsClass = menuItems.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <Tabs
      defaultValue={selectedMenu ? selectedMenu : menuItems[0]}
      className="w-full px-2  md:w-1/2"
    >
      <TabsList className={clsx("grid w-full", gridColsClass)}>
        {menuItems.map((key) => (
          <TabsTrigger
            value={key}
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              selectedMenu === key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
