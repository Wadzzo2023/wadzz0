import CreatorNotifications from "~/components/notifications/Creator-notification";
import UserNotification from "~/components/notifications/User-notification";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";

const Notification = () => {
  return (
    <div>
      <Tabs defaultValue="user" className="w-full p-4 text-center">
        <TabsList className="">
          <TabsTrigger value="user">User Notification</TabsTrigger>
          <TabsTrigger value="creator">Creator Notification</TabsTrigger>
        </TabsList>
        <TabsContent value="user">
          <UserNotification />
        </TabsContent>
        <TabsContent value="creator">
          <CreatorNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Notification;
