import { Location, LocationGroup } from "@prisma/client";
import {
  APIProvider,
  AdvancedMarker,
  ControlPosition,
  Map,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";

import { format, set } from "date-fns";
import { ClipboardList, MapPin } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Loading } from "react-daisyui";
import CreatePinModal from "~/components/maps/modals/create-pin";
import { CustomMapControl } from "~/components/maps/search/map-control";
import { Avatar } from "~/components/shadcn/ui/avatar";
import { Badge } from "~/components/shadcn/ui/badge";
import {
  ModalData,
  ModalType,
  useModal,
} from "~/lib/state/play/use-modal-store";
import { useSelectedAutoSuggestion } from "~/lib/state/play/use-selectedAutoSuggestion";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { api } from "~/utils/api";

import { create } from "zustand";
import toast from "react-hot-toast";
import Link from "next/link";
import { AIPinCreation } from "./ai-chat";

type Pin = {
  locationGroup:
    | (LocationGroup & {
        creator: { profileUrl: string | null };
      })
    | null;
  _count: {
    consumers: number;
  };
} & Location;

interface NearbyPinsState {
  nearbyPins: Pin[];
  allPins: Pin[];
  setAllPins: (pins: Pin[]) => void;
  setNearbyPins: (pins: Pin[]) => void;
  filterNearbyPins: (center: google.maps.LatLngBoundsLiteral) => void;
}

const useNearbyPinsStore = create<NearbyPinsState>((set, get) => ({
  nearbyPins: [],
  allPins: [], // Store all pins
  setNearbyPins: (pins: Pin[]) => set({ nearbyPins: pins }),
  setAllPins: (pins: Pin[]) => set({ allPins: pins }),
  filterNearbyPins: (center: google.maps.LatLngBoundsLiteral) => {
    const { allPins } = get();
    const filtered = allPins.filter(
      (pin) =>
        pin.latitude >= center.south &&
        pin.latitude <= center.north &&
        pin.longitude >= center.west &&
        pin.longitude <= center.east,
    );
    set({ nearbyPins: filtered });
  },
}));

export type IPin = {
  title?: string;
  lat: number;
  lng: number;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  autoCollect: boolean;
  pinNumber?: number;
  pinCollectionLimit?: number;
  tier?: string;
  url?: string;
  image?: string;
  token?: number;
};

interface IMapPinModal {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  prevData?: IPin;
  setPrevData: (value?: IPin) => void;
  manual: boolean;
  duplicate: boolean;
  setDuplicate: (value: boolean) => void;
  position: google.maps.LatLngLiteral | undefined;
  setManual: (value: boolean) => void;
  setPosition: (pos: google.maps.LatLngLiteral | undefined) => void;
}

export const useMapModalStore = create<IMapPinModal>((set) => ({
  isOpen: false,
  setPrevData: (value) => set({ prevData: value }),

  setIsOpen: (value) => set({ isOpen: value }),
  manual: false,
  duplicate: false,
  setDuplicate: (value) => set({ duplicate: value }),
  position: undefined,
  setManual: (value) => set({ manual: value }),
  setPosition: (pos) => set({ position: pos }),
}));

type UserLocationType = {
  lat: number;
  lng: number;
};
function App() {
  const modal = React.useRef<HTMLDialogElement>(null);
  const {
    manual,
    setManual,
    position,
    setPosition,
    duplicate,
    setIsOpen,
    setPrevData,
  } = useMapModalStore();
  const { setBalance } = useCreatorStorageAcc();
  const [mapZoom, setMapZoom] = useState<number>(3);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 22.54992,
    lng: 0,
  });
  const [centerChanged, setCenterChanged] =
    useState<google.maps.LatLngBoundsLiteral | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [RangedPins, setRangedPins] = useState<Pin[]>([]);
  const [isCordsSearch, setIsCordsSearch] = useState<boolean>(false);
  const [searchCoordinates, setSearchCoordinates] =
    useState<google.maps.LatLngLiteral>();
  const [userLocation, setUserLocation] = useState<UserLocationType>({
    lat: 44.5,
    lng: -89.5,
  });
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
  const { filterNearbyPins } = useNearbyPinsStore();

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
      setPosition(position);

      if (!isPinCopied && !isPinCut) {
        setIsOpen(true);
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
      setPosition(latLng);
    }
  }, [alreadySelectedPlace]);

  function handleManualPinClick() {
    setManual(true);
    setPosition(undefined);
    setPrevData(undefined);
    setIsOpen(true);
  }

  const handleDragEnd = () => {
    if (centerChanged) {
      filterNearbyPins(centerChanged);
    }
  };
  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Request location permission and get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
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

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
      <CustomMapControl
        controlPosition={2}
        onPlaceSelect={setSelectedPlace}
        onCenterChange={setMapCenter}
        setIsCordsSearch={setIsCordsSearch}
        setSearchCoordinates={setSearchCoordinates}
        setCordSearchLocation={setCordSearchLocation}
        setZoom={setMapZoom}
      />
      <Map
        zoomControl={true}
        zoomControlOptions={{
          position: ControlPosition.RIGHT_TOP,
        }}
        onCenterChanged={(center) => {
          setMapCenter(center.detail.center);
          setCenterChanged(center.detail.bounds);
        }}
        onZoomChanged={(zoom) => {
          setMapZoom(zoom.detail.zoom);
        }}
        onClick={handleMapClick}
        mapId={"bf51eea910020fa25a"}
        className="h-screen w-full"
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultZoom={3}
        minZoom={3}
        zoom={mapZoom}
        center={mapCenter}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        onDragend={() => handleDragEnd()}
      >
        {centerChanged && searchCoordinates && (
          <AdvancedMarker
            style={{
              color: "red",
            }}
            position={{
              lat: searchCoordinates.lat,
              lng: searchCoordinates.lng,
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
        <MyPins onOpen={onOpen} setIsAutoCollect={setIsAutoCollect} />
      </Map>
      <div className="hidden md:block">
        <SideMapItem setAlreadySelectedPlace={setAlreadySelectedPlace} />
      </div>
      <ManualPinButton handleClick={handleManualPinClick} />
      <AIPinCreation />
      <ReportCollection />
      <CreatePinModal />
    </APIProvider>
  );
}

function SideMapItem({
  setAlreadySelectedPlace,
}: {
  setAlreadySelectedPlace: (coords: { lat: number; lng: number }) => void;
}) {
  const { nearbyPins } = useNearbyPinsStore();

  return (
    <div className="absolute bottom-4 right-4 top-96 flex max-h-[400px] min-h-[400px] w-80  items-center justify-center">
      <div className="max-h-[400px] min-h-[400px] w-80 overflow-y-auto rounded-lg bg-white p-4  scrollbar-hide ">
        <h2 className="mb-4 text-lg font-semibold">Nearby Locations</h2>
        <div className="space-y-4">
          {nearbyPins.length <= 0 ? (
            <div>
              <h3 className="text-center text-gray-500">
                No nearby locations found
              </h3>
            </div>
          ) : (
            nearbyPins?.map((pin) => (
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
                    {pin.locationGroup?.title}{" "}
                    <span className=" absolute bottom-4 right-0 text-[.60rem]">
                      End At:
                      {pin.locationGroup &&
                        new Date(pin.locationGroup.endDate).toLocaleString()}
                    </span>
                  </h3>
                  <div className="mt-1 flex items-center gap-1">
                    <Avatar className="h-6 w-6">
                      <Image
                        width={24}
                        height={24}
                        src={pin.locationGroup?.image ?? "/favicon.ico"}
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
      <div className="btn" onClick={handleClick}>
        <MapPin /> Drop Pins
      </div>
    </div>
  );
}

function ReportCollection() {
  return (
    <Link href="/maps/report" className="absolute bottom-16 right-2">
      <div className="btn">
        <ClipboardList /> Collection Report
      </div>
    </Link>
  );
}

function MyPins({
  onOpen,
  setIsAutoCollect,
}: {
  onOpen: (type: ModalType, data?: ModalData) => void;
  setIsAutoCollect: (value: boolean) => void;
}) {
  const { setAllPins } = useNearbyPinsStore();
  const pins = api.maps.pin.getMyPins.useQuery();

  useEffect(() => {
    if (pins.data) {
      setAllPins(pins.data);
    }
  }, [pins.data]);

  if (pins.isLoading) return <Loading />;

  if (pins.data) {
    // const data = pins.data;
    // setAllPins(pins.data);

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
                mapTitle: pin.locationGroup?.title,
                image: pin.locationGroup?.image ?? undefined,
                mapDescription: pin.locationGroup?.description,
                endDate: pin.locationGroup?.endDate,
                startDate: pin.locationGroup?.startDate,
                pinCollectionLimit: pin.locationGroup?.limit,
                pinRemainingLimit: pin.locationGroup?.remaining,
                multiPin: pin.locationGroup?.multiPin,
                subscriptionId: pin.locationGroup?.subscriptionId ?? undefined,
                autoCollect: pin.autoCollect,
                pageAsset: pin.locationGroup?.pageAsset ?? false,
                privacy: pin.locationGroup?.privacy,
                pinNumber: pin.locationGroup?.remaining,
                link: pin.locationGroup?.link ?? undefined,
                assetId: pin.locationGroup?.assetId ?? undefined,
              });
              setIsAutoCollect(pin.autoCollect); // Set isAutoCollect to true when a pin is clicked
            }}
          >
            <Image
              src={pin.locationGroup?.creator.profileUrl ?? "/favicon.ico"}
              width={30}
              height={30}
              alt="Creator"
              className={`h-10 w-10 bg-white ${
                !pin.autoCollect ? "rounded-full " : ""
              } ${pin._count.consumers <= 0 ? "opacity-100" : "opacity-50 "}`}
            />
          </AdvancedMarker>
        ))}
      </>
    );
  }
}

export default App;
