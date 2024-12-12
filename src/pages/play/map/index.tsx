"use client";

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Map, { Marker } from "react-map-gl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, ScanLine, RefreshCcw, Crosshair } from "lucide-react";
import { useExtraInfo } from "~/lib/state/play/useExtraInfo";
import { useNearByPin } from "~/lib/state/play/useNearbyPin";
import { useAccountAction } from "~/lib/state/play/useAccountAction";
import { useModal } from "~/lib/state/play/useModal";
import { ConsumedLocation } from "~/types/game/location";
import { Button } from "~/components/shadcn/ui/button";
import { Card } from "~/components/shadcn/ui/card";
import Loading from "~/components/wallete/loading";
import { BASE_URL } from "~/lib/common";
import { getMapAllPins } from "~/lib/play/get-Map-all-pins";
import { getUserPlatformAsset } from "~/lib/play/get-user-platformAsset";
import { useWalkThrough } from "~/components/hooks/play/useWalkthrough";
import { Walkthrough } from "~/components/walkthrough";

type UserLocationType = {
  lat: number;
  lng: number;
};
type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export default function HomeScreen() {
  const [locationPermission, setLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocationType | null>(
    null,
  );

  const [pinCollected, setPinCollected] = useState(false);
  const router = useRouter();
  const { setData: setExtraInfo } = useExtraInfo();
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<UserLocationType | null>(null);
  const { setData } = useNearByPin();
  const { data } = useAccountAction();
  const autoCollectModeRef = useRef(data.mode);
  const { onOpen } = useModal();
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const { data: accountActionData } = useAccountAction();
  const { data: walkthroughData } = useWalkThrough();

  const welcomeRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);
  const recenterButtonRef = useRef<HTMLButtonElement>(null);
  const arButtonRef = useRef<HTMLButtonElement>(null);
  const pinAutoCollectionRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Welcome to the Wadzzo app!",
      content:
        "This tutorial will show you how to use Wadzzo to find pins around you, follow your favorite brands, and collect rewards.",
    },
    {
      target: buttonLayouts[1],
      title: "Wadzzo Balance",
      content:
        "The Wadzzo Balance displays your Wadzzo count. Check the Bounty Board for the latest ways to earn more Wadzzo!",
    },
    {
      target: buttonLayouts[2],
      title: "Refresh Button",
      content:
        "If you need to refresh your map, press the refresh button. This will reload your entire map with all up to date app data.",
    },
    {
      target: buttonLayouts[3],
      title: "Re-center button",
      content:
        "Press the Re-center button to center your map view to your current location",
    },
    {
      target: buttonLayouts[4],
      title: "AR button",
      content:
        "To collect manual pins, press the AR button on your map to view your surroundings.  Locate the icon on your screen, then press the Collect button that appears below it to add the item to your collection.",
    },
    {
      target: buttonLayouts[5],
      title: "Pin Auto Collection",
      content:
        "This celebration occurs when a pin has been automatically collected in Wadzzo.",
    },
  ];
  const getNearbyPins = (
    userLocation: UserLocationType,
    locations: ConsumedLocation[],
    radius: number,
  ) => {
    return locations.filter((location) => {
      if (location.auto_collect || location.collection_limit_remaining <= 0)
        return false;
      const distance = getDistanceFromLatLonInMeters(
        userLocation.lat,
        userLocation.lng,
        location.lat,
        location.lng,
      );
      return distance <= radius;
    });
  };

  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 -
      Math.cos(dLat) / 2 +
      (Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon))) /
      2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  const handleARPress = (
    userLocation: UserLocationType,
    locations: ConsumedLocation[],
  ) => {
    const nearbyPins = getNearbyPins(userLocation, locations, 50000);
    if (nearbyPins.length > 0) {
      setData({
        nearbyPins: nearbyPins,
        singleAR: false,
      });
      router.push("/play/ar");
    } else {
      onOpen("NearbyPin");
    }
  };

  const handleRecenter = () => {
    if (userLocation) {
      setCenter({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
    }
  };

  const getAutoCollectPins = (
    userLocation: UserLocationType,
    locations: ConsumedLocation[],
    radius: number,
  ) => {
    return locations.filter((location) => {
      if (location.collection_limit_remaining <= 0) return false;
      if (location.auto_collect) {
        const distance = getDistanceFromLatLonInMeters(
          userLocation.lat,
          userLocation.lng,
          location.lat,
          location.lng,
        );
        return distance <= radius;
      }
    });
  };

  const collectPinsSequentially = async (pins: ConsumedLocation[]) => {
    for (const pin of pins) {
      if (!autoCollectModeRef.current) {
        console.log("Auto collect mode paused");
        return; // Exit if auto-collect is turned off
      }
      if (pin.collection_limit_remaining <= 0) {
        console.log("Pin limit reached:", pin.id);
        continue;
      }
      const response = await fetch(
        new URL("api/game/locations/consume", BASE_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location_id: pin.id.toString() }),
        },
      );

      if (response.ok) {
        console.log("Collected pin:", pin.id);
        showPinCollectionAnimation();
      }

      await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait 20 seconds
    }
  };

  const showPinCollectionAnimation = () => {
    setPinCollected(true);
    setTimeout(() => setPinCollected(false), 2000);
  };

  const response = useQuery({
    queryKey: ["MapsAllPins", accountActionData.brandMode],
    queryFn: () =>
      getMapAllPins({
        filterID: accountActionData.brandMode ? "1" : "0",
      }),
  });
  const balanceRes = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });

  const locations = response.data?.locations ?? [];


  useLayoutEffect(() => {
    const updateButtonLayouts = () => {
      const welcome = welcomeRef.current;
      const balance = balanceRef.current;
      const refreshButton = refreshButtonRef.current;
      const recenterButton = recenterButtonRef.current;
      const arButton = arButtonRef.current;
      if (welcome && balance && refreshButton && recenterButton && arButton) {
        const welcomeRect = welcome.getBoundingClientRect();
        const balanceRect = balance.getBoundingClientRect();
        const refreshRect = refreshButton.getBoundingClientRect();
        const recenterRect = recenterButton.getBoundingClientRect();
        const arRect = arButton.getBoundingClientRect();

        setButtonLayouts([
          {
            x: welcomeRect.left,
            y: welcomeRect.top,
            width: welcomeRect.width,
            height: welcomeRect.height,
          },

          {
            x: balanceRect.left,
            y: balanceRect.top,
            width: balanceRect.width,
            height: balanceRect.height,
          },
          {
            x: refreshRect.left,
            y: refreshRect.top,
            width: refreshRect.width,
            height: refreshRect.height,
          },
          {
            x: recenterRect.left,
            y: recenterRect.top,
            width: recenterRect.width,
            height: recenterRect.height,
          },
          {
            x: arRect.left,
            y: arRect.top,
            width: arRect.width,
            height: arRect.height,
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

  useEffect(() => {
    autoCollectModeRef.current = data.mode;
  }, [data.mode]);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Request location permission and get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission(true);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setExtraInfo({
          useCurrentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        setLoading(false);
      },
      (error) => {
        alert("Permission to access location was denied");
        console.error(error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    if (data.mode && userLocation && locations) {
      const autoCollectPins = getAutoCollectPins(userLocation, locations, 100);
      if (autoCollectPins.length > 0) {
        collectPinsSequentially(autoCollectPins);
      }
    }
  }, [data.mode, userLocation, locations]);

  if (response.isLoading) {
    return <Loading />;
  }
  return (
    <div className="relative h-screen w-full">
      {loading ? (
        <Loading />
      ) : (
        locationPermission &&
        userLocation && (
          <>
            <Map
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API}
              initialViewState={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                zoom: 12,
              }}
              latitude={center?.lat}
              longitude={center?.lng}
              onDrag={(e) => {
                setCenter({
                  lat: e.viewState.latitude ?? 0,
                  lng: e.viewState.longitude ?? 0,
                });
              }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v9"
            >
              <Marker
                latitude={userLocation.lat}
                longitude={userLocation.lng}
                anchor="center"
              >
                <MapPin size={40} className="text-red-500" />
              </Marker>
              <MyPins locations={locations} />
              {
                showWalkthrough && (
                  <div ref={welcomeRef}>

                  </div>
                )
              }
            </Map>

            <div
              ref={balanceRef}
              className="absolute top-2 right-2 z-10 bg-[#38C02B] flex p-2 rounded-lg
            ">
              <Image
                height={40}
                width={40}
                alt="Wadzzo"
                src="/images/wadzzo.png"
                className="object-contain  h-6 w-6"
              />
              <div className="ml-2 text-white">
                {Number(balanceRes.data).toFixed(2) ?? 0}
              </div>
            </div>
            <Button
              ref={recenterButtonRef}
              variant="outline"
              size="icon"
              className="absolute bottom-20 right-2 z-10 bg-white"
              onClick={handleRecenter}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button
              ref={arButtonRef}
              variant="default"
              size="icon"
              className="absolute bottom-36 right-2 z-10 bg-primary"
              onClick={() => handleARPress(userLocation, locations)}
            >
              <ScanLine className="h-6 w-6" />
            </Button>
            <Button
              ref={refreshButtonRef}
              variant="outline"
              size="icon"
              className="absolute bottom-20 right-16 z-10 bg-white"
              onClick={() => response.refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            {pinCollected && (
              <Card


                className="absolute bottom-[300px] left-1/2 -ml-[50px] flex h-[100px] w-[100px] animate-pulse items-center justify-center rounded-full bg-primary">
                <Image
                  height={80}
                  width={80}
                  alt="Wadzzo"
                  src="/assets/images/wadzzo.png"
                  className="object-contain"
                />
              </Card>
            )}
          </>
        )
      )}
      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}

function MyPins({ locations }: { locations: ConsumedLocation[] }) {
  const { onOpen } = useModal();

  return (
    <>
      {locations.map((location: ConsumedLocation, index: number) => (
        <Marker
          key={index}
          latitude={location.lat}
          longitude={location.lng}
          anchor="center"
          onClick={() =>
            onOpen("LocationInformation", {
              Collection: location,
            })
          }
        >
          <Image
            height={40}
            width={40}
            alt="Wadzzo"
            src={location.brand_image_url}
            className="rounded-full"
          />
        </Marker>
      ))}
    </>
  );
}
