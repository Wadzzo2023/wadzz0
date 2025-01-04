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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Loader2 } from "lucide-react";
import CreatorLayout from "./layout";

export default function CreatorsPost() {
  const creator = api.fan.creator.meCreator.useQuery();

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 p-1 md:p-8">
        <Card className=" shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-primary">
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="flex w-full flex-col items-center justify-center space-y-8">
              <CreateTabs />
              <div className="w-full">
                <RenderTabs />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
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
  return null;
}

function CreateTabs() {
  const { selectedMenu, setSelectedMenu } = useCreateMenu();
  const menuItems = Object.values(CreateMenu);
  const gridColsClass = menuItems.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <Tabs
      defaultValue={selectedMenu ? selectedMenu : menuItems[0]}
      className="w-full px-2 md:w-3/4"
    >
      <TabsList
        className={clsx("grid w-full rounded-lg bg-muted", gridColsClass)}
      >
        {menuItems.map((key) => (
          <TabsTrigger
            value={key}
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              "rounded-md py-2 text-sm font-medium transition-all",
              selectedMenu === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted-foreground/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
