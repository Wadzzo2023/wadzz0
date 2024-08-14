import clsx from "clsx";
import React from "react";
import { CreatPost, PostList } from "~/components/fan/creator/CreatPost";
import { CreateMenu, useCreateMenu } from "~/lib/state/fan/create-menu";
import { api } from "~/utils/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";

export default function CreatorsPost() {
  const creator = api.fan.creator.meCreator.useQuery();
  if (creator.data)
    return (
      <div className="h-screen p-0 md:p-5">
        <h2 className="mb-5 text-center text-2xl font-bold">Contents</h2>

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
  const { setSelectedMenu, selectedMenu } = useCreateMenu();
  switch (selectedMenu) {
    case CreateMenu.Home:
      return <CreatPost />;
    case CreateMenu.Posts:
      return (
        <div className="w-full">
          <Posts />
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
  const { selectedMenu, setSelectedMenu } = useCreateMenu();
  const menuItems = Object.values(CreateMenu);
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
