import { Location } from "@prisma/client";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { format, set } from "date-fns";
import { MapPin, Pin } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { Loading } from "react-daisyui";
import toast from "react-hot-toast";
import { useModal } from "~/components/hooks/use-modal-store";
import { useSelectedAutoSuggestion } from "~/components/hooks/use-selectedAutoSuggestion";
import CreatePinModal from "~/components/maps/modals/create-pin";
import { CustomMapControl } from "~/components/maps/search/map-control";
import { Avatar } from "~/components/shadcn/ui/avatar";
import { Badge } from "~/components/shadcn/ui/badge";
// import { PlacesAutocomplete } from "~/components/maps/place";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";

import { api } from "~/utils/api";

type pins = ({
  creator: {
    profileUrl: string | null;
  };
  _count: {
    consumers: number;
  };
} & Location)[];

function App() {
  const modal = React.useRef<HTMLDialogElement>(null);
  const [clickedPos, updatePos] = useState<google.maps.LatLngLiteral>();
  const [manual, setManual] = useState<boolean>();
  const { setBalance } = useCreatorStorageAcc();
  const [mapZoom, setMapZoom] = useState<number>(3);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 22.54992,
    lng: 0,
  });
  const [centerChanged, setCenterChanged] =
    useState<google.maps.LatLngBoundsLiteral | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [RangedPins, setRangedPins] = useState<pins>([]);
  const [isCordsSearch, setIsCordsSearch] = useState<boolean>(false);
  const {
    selectedPlace: alreadySelectedPlace,
    setSelectedPlace: setAlreadySelectedPlace,
  } = useSelectedAutoSuggestion();
  const [cordSearchCords, setCordSearchLocation] =
    useState<google.maps.LatLngLiteral>();
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const {
    onOpen,
    isPinCopied,
    data,
    isAutoCollect,
    isPinCut,
    setIsAutoCollect,
  } = useModal();

  // queries
  const acc = api.wallate.acc.getCreatorStorageBallances.useQuery(undefined, {
    onSuccess: (data) => {
      // console.log(data);
      setBalance(data);
    },
    onError: (error) => {
      console.log(error);
    },
    refetchOnWindowFocus: false,
  });

  function handleMapClick(event: MapMouseEvent): void {
    setManual(false);
    const position = event.detail.latLng;
    if (position) {
      updatePos(position);
      if (!isPinCopied && !isPinCut) {
        modal.current?.showModal();
      } else if (isPinCopied || isPinCut) {
        onOpen("copied", {
          long: position.lng,
          lat: position.lat,
          pinId: data.pinId,
        });
      }
    }
  }
  useEffect(() => {
    if (alreadySelectedPlace) {
      const latLng = {
        lat: alreadySelectedPlace.lat,
        lng: alreadySelectedPlace.lng,
      };
      setMapCenter(latLng);
      setMapZoom(13);
      updatePos(latLng);
    }
  }, [alreadySelectedPlace]);

  function handleManualPinClick() {
    setManual(true);
    updatePos(undefined);
    modal.current?.showModal();
  }

  const GetPinMutation = api.maps.pin.getRangePins.useMutation({
    onSuccess: (data) => {
      console.log(data);
      setRangedPins(data);
      setLoading(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setLoading(false);
    },
  });
  const handleCenterChange = useCallback(
    (center: google.maps.LatLngBoundsLiteral) => {
      if (center) {
        GetPinMutation.mutate({
          eastLongitude: center.east,
          westLongitude: center.west,
          northLatitude: center.north,
          southLatitude: center.south,
        });
      }
    },
    [GetPinMutation],
  );
  useEffect(() => {
    if (centerChanged) {
      setLoading(true);

      // Start a 5-second timer to call handleCenterChange
      const timer = setTimeout(() => {
        console.log(
          "Center hasn't changed for 5 seconds, calling handleCenterChange",
        );
        handleCenterChange(centerChanged);
        setLoading(false);
      }, 5000); // 5-second delay

      // Clear the timer if centerChanged changes within 5 seconds, preventing handleCenterChange from being called
      return () => {
        clearTimeout(timer);
        setLoading(false); // Reset loading if the center changes again within 5 seconds
      };
    }
  }, [centerChanged]); // Only depends on centerChanged, not handleCenterChange

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
      <CustomMapControl
        controlPosition={3}
        onPlaceSelect={setSelectedPlace}
        onCenterChange={setMapCenter}
        setIsCordsSearch={setIsCordsSearch}
        setCordSearchLocation={setCordSearchLocation}
      />
      <Map
        onCenterChanged={(center) => {
          setMapCenter(center.detail.center);
          setCenterChanged(center.detail.bounds); // Update the centerChanged state with new bounds
        }}
        onZoomChanged={(zoom) => {
          setMapZoom(zoom.detail.zoom);
        }}
        onClick={handleMapClick}
        mapId={"bf51eea910020fa25a"}
        style={{ height: "100vh" }}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultZoom={3}
        zoom={mapZoom}
        center={mapCenter}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      >
        {isCordsSearch && cordSearchCords && (
          <AdvancedMarker
            style={{
              color: "red",
            }}
            position={{
              lat: cordSearchCords.lat,
              lng: cordSearchCords.lng,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-8"
            >
              <path
                fillRule="evenodd"
                d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                clipRule="evenodd"
              />
            </svg>
          </AdvancedMarker>
        )}
        <MyPins />
      </Map>
      <div className="hidden md:block">
        <SideMapItem rangedPins={RangedPins} />
      </div>
      <ManualPinButton handleClick={handleManualPinClick} />
      {(clickedPos ?? manual) && (
        <CreatePinModal modal={modal} position={clickedPos} manual={manual} />
      )}
    </APIProvider>
  );

  function SideMapItem({ rangedPins }: { rangedPins: pins }) {
    return (
      <div className="absolute bottom-4 right-4 top-96 flex max-h-[400px] min-h-[400px] w-80  items-center justify-center">
        <div className="max-h-[400px] min-h-[400px] w-80 overflow-y-auto rounded-lg bg-white p-4  scrollbar-hide ">
          <h2 className="mb-4 text-lg font-semibold">Nearby Locations</h2>
          <div className="space-y-4">
            {loading && (
              <div className="flex h-[300px] items-center justify-center">
                <Loading />
              </div>
            )}
            {!loading && rangedPins.length <= 0 ? (
              <div>
                <h3 className="text-center text-gray-500">
                  No nearby locations found
                </h3>
              </div>
            ) : (
              !loading &&
              rangedPins?.map((pin) => (
                <div
                  onClick={() => {
                    setAlreadySelectedPlace({
                      lat: pin.latitude,
                      lng: pin.longitude,
                    });
                  }}
                  key={pin.id}
                  className="flex items-start gap-3 rounded-md bg-gray-50 p-3 shadow-lg transition-colors hover:bg-gray-100"
                >
                  <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <h3 className="relative font-medium">
                      {pin.title}{" "}
                      <span className=" absolute bottom-4 right-0 text-[.60rem]">
                        End At:
                        {format(new Date(pin.endDate), "dd, yyyy")}
                      </span>
                    </h3>
                    <div className="mt-1 flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <Image
                          width={24}
                          height={24}
                          src={pin.image ?? "/favicon.ico"}
                          alt="Creator"
                        />
                      </Avatar>
                      <Badge variant="secondary" className="text-xs">
                        {pin._count.consumers} visitors
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function ManualPinButton({ handleClick }: { handleClick: () => void }) {
    return (
      <div className="absolute bottom-2 right-2">
        <div className="btn btn-circle" onClick={handleClick}>
          <MapPin />
        </div>
      </div>
    );
  }

  function MyPins() {
    const pins = api.maps.pin.getMyPins.useQuery();

    if (pins.isLoading) return <Loading />;

    if (pins.data) {
      return (
        <>
          {pins.data.map((pin) => (
            <AdvancedMarker
              key={pin.id}
              position={{ lat: pin.latitude, lng: pin.longitude }}
              onClick={() => {
                onOpen("map", {
                  pinId: pin.id,
                  long: pin.longitude,
                  lat: pin.latitude,
                  mapTitle: pin.title,
                  image: pin.image ?? undefined,
                  mapDescription: pin?.description,
                });
                setIsAutoCollect(pin.autoCollect); // Set isAutoCollect to true when a pin is clicked
              }}
            >
              <Image
                src={pin.creator.profileUrl ?? "/favicon.ico"}
                width={30}
                height={30}
                alt="Creator"
                className={`h-10 w-10 bg-white ${
                  !pin.autoCollect ? "rounded-full " : ""
                } ${pin._count.consumers <= 0 ? "opacity-50" : "opacity-100"}`}
              />
            </AdvancedMarker>
          ))}
        </>
      );
    }
  }
}
export default App;
