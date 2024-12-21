"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Eye, ScanLine, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWalkThrough } from "~/components/hooks/play/useWalkthrough";

import { Badge } from "~/components/shadcn/ui/badge";
import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { Walkthrough } from "~/components/walkthrough";
import Loading from "~/components/wallete/loading";
import { BASE_URL } from "~/lib/common";
import { useCollection } from "~/lib/state/play/useCollection";
import { useModal } from "~/lib/state/play/useModal";
import { useNearByPin } from "~/lib/state/play/useNearbyPin";
import { ConsumedLocation } from "~/types/game/location";
type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export default function MyCollectionScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [sortBy, setSortBy] = useState("title");
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);

  const { onOpen } = useModal();
  const { setData } = useCollection();
  const { setData: setNearByPinData } = useNearByPin();
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const arButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const viewButtonRef = useRef<HTMLButtonElement>(null);
  const { data: walkthroughData } = useWalkThrough();
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Filter Collection",
      content: "User can filter Collection between Title and Remaining Limit",
    },
    {
      target: buttonLayouts[1],
      title: "View in AR",
      content:
        "Press the AR button to view your digital item in AR mode.  In AR, explore your surroundings and see your pin as a real-life item.",
    },
    {
      target: buttonLayouts[2],
      title: "Delete Collection",
      content:
        "Once you've redeemed a reward, use it to permanently remove the pin from your collection.",
    },
    {
      target: buttonLayouts[3],
      title: "View Collection",
      content:
        "Pressing View on a pin reveals details like the brand, collection date, item info, a Claim button for more details, collection limits, and more.",
    },
  ];
  const dummyCollection: ConsumedLocation[] = [
    {
      id: "1",
      title: "Pin Title",
      description: "This is a dummy collected pin description",
      image_url: "https://app.wadzzo.com/images/loading.png",
      collection_limit_remaining: 1,
      lat: 1.0,
      lng: 1.0,
      url: "https://www.google.com",
      collected: true,
      auto_collect: false,
      brand_id: "1",
      brand_image_url: "https://app.wadzzo.com/images/loading.png",
      brand_name: "Dummy Brand",
      modal_url: "https://www.google.com",
      viewed: true,
    },
  ];
  const getCollections = async () => {
    try {
      const response = await fetch(
        new URL(
          "api/game/locations/get_consumed_location",
          BASE_URL,
        ).toString(),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }

      const data = (await response.json()) as { locations: ConsumedLocation[] };
      console.log("Data", data);
      return data;
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["collection"],
    queryFn: getCollections,
  });

  const sortLocations = (locations: ConsumedLocation[]) => {
    return [...locations].sort((a, b) => {
      if (sortBy === "Title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "Limit Remaining") {
        return b.collection_limit_remaining - a.collection_limit_remaining;
      }
      return 0;
    });
  };

  const handleFilterChange = (filter: string) => {
    setSortBy(filter);
  };

  const sortedLocations = useMemo(
    () => sortLocations(data?.locations ?? []),
    [data?.locations, sortBy],
  );

  const onARPress = (item: ConsumedLocation) => {
    setNearByPinData({
      nearbyPins: item ? [item] : [],
      singleAR: true,
    });
    router.push("/play/ar");
  };
  useLayoutEffect(() => {
    const updateButtonLayouts = () => {
      const filterButton = filterButtonRef.current;
      const arButton = arButtonRef.current;
      const deleteButton = deleteButtonRef.current;
      const viewButton = viewButtonRef.current;

      if (filterButton && arButton && deleteButton && viewButton) {
        const filterRect = filterButton.getBoundingClientRect();
        const arRect = arButton.getBoundingClientRect();
        const deleteRect = deleteButton.getBoundingClientRect();
        const viewRect = viewButton.getBoundingClientRect();
        console.log("filterRect", filterRect);
        setButtonLayouts([
          {
            x: filterRect.left,
            y: filterRect.top,
            width: filterRect.width,
            height: filterRect.height,
          },
          {
            x: arRect.left,
            y: arRect.top,
            width: arRect.width,
            height: arRect.height,
          },
          {
            x: deleteRect.left,
            y: deleteRect.top,
            width: deleteRect.width,
            height: deleteRect.height,
          },
          {
            x: viewRect.left,
            y: viewRect.top,
            width: viewRect.width,
            height: viewRect.height,
          },

        ]);
      }
    };

    const observer = new MutationObserver(() => {
      updateButtonLayouts();
    });

    // Start observing the document for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial layout calculation
    updateButtonLayouts();

    // Clean up the observer
    return () => {
      observer.disconnect();
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


  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-lg text-red-500">Error fetching collections</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col p-2 pb-16">
      <div className="mb-4 flex items-center justify-between rounded-b-2xl bg-[#38C02B] p-4">
        <h1 className="text-2xl font-bold">My Collection</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button ref={filterButtonRef} variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort By: {sortBy}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["Title", "Limit Remaining"].map((filter) => (
              <DropdownMenuItem
                key={filter}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {
        <div className="flex flex-col gap-2 overflow-y-auto">
          {showWalkthrough ?
            dummyCollection.map((item: ConsumedLocation) => (
              <Card key={`${item.id}`}>
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                    />
                    <Badge className="absolute right-2 top-2 bg-primary">
                      {item.collection_limit_remaining}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="mb-2">{item.title}</CardTitle>
                  <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Lat: {item.lat.toFixed(4)}, Lng: {item.lng.toFixed(4)}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2  w-full">
                    <Button
                      ref={arButtonRef}
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => onARPress(item)}
                    >
                      <ScanLine className="h-4 w-4" />
                    </Button>
                    <Button
                      ref={deleteButtonRef}
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onOpen("Delete", {
                          collectionId: item.id as string,
                          collectionName: item.title,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      ref={viewButtonRef}
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setData({
                          collections: item,
                        });
                        router.push(`/play/collections/${item.id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )) : sortedLocations.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p>No collections found</p>
              </div>
            ) : (
              sortedLocations.map((item: ConsumedLocation) => (
                <Card key={`${item.id}`}>
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                      />
                      <Badge className="absolute right-2 top-2 bg-primary">
                        {item.collection_limit_remaining}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="mb-2">{item.title}</CardTitle>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Lat: {item.lat.toFixed(4)}, Lng: {item.lng.toFixed(4)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2 w-full">
                      <Button
                        ref={arButtonRef}
                        size="sm"
                        className="w-full"
                        variant="outline"
                        onClick={() => onARPress(item)}
                      >
                        <ScanLine className="h-4 w-4" />
                      </Button>
                      <Button
                        ref={deleteButtonRef}
                        className="w-full"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onOpen("Delete", {
                            collectionId: item.id as string,
                            collectionName: item.title,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        ref={viewButtonRef}
                        className="w-full"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setData({
                            collections: item,
                          });
                          router.push(`/play/collections/${item.id}`);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )))}
        </div>
      }

      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}
