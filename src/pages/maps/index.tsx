import { Location } from "@prisma/client";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { format } from "date-fns";
import { MapPin, Pin } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
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
  const [RangedPins, setRangedPins] = useState<pins>([]);
  const {
    selectedPlace: alreadySelectedPlace,
    setSelectedPlace: setAlreadySelectedPlace,
  } = useSelectedAutoSuggestion();
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
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const handleCenterChange = (center: google.maps.LatLngBoundsLiteral) => {
    if (center) {
      const data = GetPinMutation.mutate({
        eastLongitude: center.east,
        westLongitude: center.west,
        northLatitude: center.north,
        southLatitude: center.south,
      });
    }
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
      <CustomMapControl controlPosition={2} onPlaceSelect={setSelectedPlace} />
      <Map
        onCenterChanged={(center) => {
          console.log(center);
          setMapCenter(center.detail.center);
          handleCenterChange(center.detail.bounds);
        }}
        onZoomChanged={(zoom) => {
          setMapZoom(zoom.detail.zoom);
        }}
        onClick={handleMapClick}
        mapId={"bf51eea910020fa25a"}
        style={{ height: "100vh" }}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultZoom={3}
        onDragend={(center) => {
          console.log(center);
        }}
        zoom={mapZoom}
        center={mapCenter}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      >
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
      <div className="absolute bottom-4 right-4 top-4 flex w-64 items-center justify-center  ">
        <div className="max-h-[300px] min-h-[300px] w-60 overflow-y-auto rounded-lg bg-white p-4  scrollbar-hide ">
          <h2 className="mb-4 text-lg font-semibold">Nearby Locations</h2>
          <div className="space-y-4">
            {rangedPins?.map((pin) => (
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
            ))}
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
              {pin._count.consumers < pin.limit ? (
                <span>
                  <Image
                    src={pin.creator.profileUrl ?? "/favicon.ico"}
                    width={30}
                    height={30}
                    alt="vong cong"
                  />
                </span>
              ) : (
                <span className="tree">(🌳)</span>
              )}
            </AdvancedMarker>
          ))}
        </>
      );
    }
  }
}
export default App;
