"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Copy, Globe, LogOut, RotateCcw, Trash } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "~/components/shadcn/ui/button";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { Switch } from "~/components/shadcn/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { ScrollArea } from "~/components/shadcn/ui/scroll-area";
import { useAccountAction } from "~/lib/state/play/useAccountAction";

import Loading from "~/components/wallete/loading";
import { BASE_URL } from "~/lib/common";
import { addrShort } from "~/utils/utils";
import { getTokenUser } from "~/lib/play/get-token-user";
import { signOut } from "next-auth/react";
import { useWalkThrough } from "~/components/hooks/play/useWalkthrough";
import { Walkthrough } from "~/components/walkthrough";
type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function SettingScreen() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const router = useRouter();
  const { data: pinMode, setData } = useAccountAction();
  const { data: walkthroughData, setData: setWalkThroughData } =
    useWalkThrough();

  const visitButtonRef = useRef<HTMLButtonElement>(null);
  const autoCollectButtonRef = useRef<HTMLButtonElement>(null);
  const resetTutorialButtonRef = useRef<HTMLButtonElement>(null);
  const deleteDataButtonRef = useRef<HTMLButtonElement>(null);
  const signOutButtonRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUserInfo"],
    queryFn: getTokenUser,
  });

  const steps = [

    {
      target: buttonLayouts[0],
      title: "Visit Wadzzo.com",
      content: "Click here to visit our website and explore our services.",
    },
    {
      target: buttonLayouts[1],
      title: "Auto Collection",
      content:
        "Enable Auto Collection to automatically collect eligible pins.  All pins set for auto collection will be gathered when you’re within collecting distance, but all manual pins must still be collected through AR mode.",
    },
    {
      target: buttonLayouts[2],
      title: "Reset Tutorial",
      content: "Click here to restart the tutorial and view it again.",
    },
    {
      target: buttonLayouts[3],
      title: "Delete Data",
      content:
        "Press this button to delete your account.  A request will be sent to our support team and your account will be permanently deleted.",
    },
    {
      target: buttonLayouts[4],
      title: "Sign Out",
      content: "Click here to log out of your wadzzo account.",
    },
  ];

  const resetTutorial = () => {

    // console.log("Resetting tutorial");
    localStorage.setItem("isFirstSignIn", "true");
    setShowWalkthrough(true);
    setWalkThroughData({
      showWalkThrough: true,
    });
  };


  const deleteData = async () => {
    try {
      const response = await fetch(
        new URL("api/game/user/delete-user", BASE_URL).toString(),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        toast.error("Error deleting");
      }
      await response.json();
      toast.success("Data deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };

  const togglePinCollectionMode = () => {
    setData({
      mode: !pinMode.mode,
    });
    console.log(
      `Pin Collection Mode set to: ${!pinMode.mode ? "Auto Collect" : "Manual Collect"
      }`,
    );
  };

  useLayoutEffect(() => {
    const updateButtonLayouts = () => {
      const visitButton = visitButtonRef.current;
      const autoCollectButton = autoCollectButtonRef.current;
      const resetTutorialButton = resetTutorialButtonRef.current;
      const deleteDataButton = deleteDataButtonRef.current;
      const signOutButton = signOutButtonRef.current;


      if (visitButton && autoCollectButton && resetTutorialButton && deleteDataButton && signOutButton) {
        const visitRect = visitButton.getBoundingClientRect();
        const autoCollectRect = autoCollectButton.getBoundingClientRect();
        const resetTutorialRect = resetTutorialButton.getBoundingClientRect();
        const deleteDataRect = deleteDataButton.getBoundingClientRect();
        const signOutRect = signOutButton.getBoundingClientRect();

        setButtonLayouts([
          {
            x: visitRect.x,
            y: visitRect.y,
            width: visitRect.width,
            height: visitRect.height,
          },
          {
            x: autoCollectRect.x,
            y: autoCollectRect.y,
            width: autoCollectRect.width,
            height: autoCollectRect.height,
          },
          {
            x: resetTutorialRect.x,
            y: resetTutorialRect.y,
            width: resetTutorialRect.width,
            height: resetTutorialRect.height,
          },
          {
            x: deleteDataRect.x,
            y: deleteDataRect.y,
            width: deleteDataRect.width,
            height: deleteDataRect.height,
          },
          {
            x: signOutRect.x,
            y: signOutRect.y,
            width: signOutRect.width,
            height: signOutRect.height,
          },
        ]);
      }
    };

    // Initial update
    updateButtonLayouts();
    console.log("buttonLayouts", buttonLayouts);
    // Set up a timeout to update again after a short delay
    const timeoutId = setTimeout(updateButtonLayouts, 3000);

    // Set up resize listener
    window.addEventListener('resize', updateButtonLayouts);

    return () => {
      window.removeEventListener('resize', updateButtonLayouts);
      clearTimeout(timeoutId);
    };
  }, []);

  const checkFirstTimeSignIn = async () => {
    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };

  useEffect(() => {
    console.log("walkthroughData", walkthroughData);
    checkFirstTimeSignIn();

  }, [walkthroughData]);

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {(error as Error).message}</div>;

  if (!data) return null;

  return (
    <>
      <ScrollArea className="h-full">
        <div className="container mx-auto space-y-4 p-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Image
                src={
                  data.image ??
                  "https://app.wadzzo.com/images/icons/avatar-icon.png"
                }
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full"
              />
              <div className="ml-4">
                <h2 className="text-2xl font-bold">{data.name}</h2>
                <p className="text-gray-600">{data.email}</p>
                <div className="mt-2 flex items-center">
                  <p className="text-sm text-gray-500">
                    {addrShort(data.id, 5)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={async () => {
                      await navigator.clipboard.writeText(data.id);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Button
                ref={visitButtonRef}
                className="w-full"
                onClick={() => window.open("https://wadzzo.com", "_blank")}
              >
                <Globe className="mr-2 h-4 w-4" />
                Visit Wadzzo.com
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-xl font-semibold">Account Actions</h3>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Collection</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={pinMode.mode ? "text-gray-500" : "font-medium"}
                  >
                    Off
                  </span>
                  <Switch
                    ref={autoCollectButtonRef}
                    checked={pinMode.mode}
                    onCheckedChange={togglePinCollectionMode}
                  />
                  <span
                    className={pinMode.mode ? "font-medium" : "text-gray-500"}
                  >
                    On
                  </span>
                </div>
              </div>

              <hr className="my-4" />
              <Button
                ref={resetTutorialButtonRef}
                variant="outline"
                className="w-full"
                onClick={() => resetTutorial()}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Tutorial
              </Button>
              <Button
                ref={deleteDataButtonRef}
                variant="outline"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Data
              </Button>

              <Button
                ref={signOutButtonRef}
                className="w-full"
                onClick={async () =>
                  await signOut({
                    callbackUrl: "https://app.wadzzo.com/play",
                  })
                }
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all your data? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteData}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </>
  );
}
