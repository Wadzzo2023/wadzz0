import { Creator, Location, LocationGroup } from "@prisma/client";
import {
    APIProvider,
    AdvancedMarker,
    ControlPosition,
    Map,
    MapMouseEvent,
} from "@vis.gl/react-google-maps";

import { ClipboardList, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import React, { memo, useEffect, useState } from "react";
import { Loading } from "react-daisyui";
import { CustomMapControl } from "~/components/maps/search/map-control";

import {
    ModalData,
    ModalType,
    useModal,
} from "~/lib/state/play/use-modal-store";
import { useSelectedAutoSuggestion } from "~/lib/state/play/use-selectedAutoSuggestion";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { api } from "~/utils/api";

import { create } from "zustand";
import { useAdminMapModalStore } from "~/components/hooks/use-AdminModal-store";
import CreateAdminPinModal from "~/components/maps/admin/create-pin";
import { useSelectCreatorStore } from "~/components/hooks/use-select-creator-store";
import { Label } from "~/components/shadcn/ui/label";
import { Switch } from "~/components/shadcn/ui/switch";

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

type AssetType = {
    id: number
    code: string
    issuer: string
    thumbnail: string
}
type UserLocationType = {
    lat: number;
    lng: number;
};
function AdminMap() {
    const {
        setManual,
        setPosition,
        setIsOpen,
        setPrevData,
    } = useAdminMapModalStore();
    const creator = api.fan.creator.getCreators.useQuery()
    const { setData: setSelectedCreator, data: selectedCreator } = useSelectCreatorStore()

    const { setBalance } = useCreatorStorageAcc();
    const [mapZoom, setMapZoom] = useState<number>(3);
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
        lat: 22.54992,
        lng: 0,
    });
    const [showExpired, setShowExpired] = useState<boolean>(false)

    const [centerChanged, setCenterChanged] =
        useState<google.maps.LatLngBoundsLiteral | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isCordsSearch, setIsCordsSearch] = useState<boolean>(false);
    const [searchCoordinates, setSearchCoordinates] =
        useState<google.maps.LatLngLiteral>();
    const [userLocation, setUserLocation] = useState<UserLocationType>(
        {
            lat: 44.500000,
            lng: -89.500000,
        }
    );
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

    useEffect(() => {
        console.log(selectedCreator)
    }
        , [selectedCreator])

    return (
        <div className="relative h-screen w-full">
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
                    {
                        selectedCreator && (
                            <MyPins onOpen={onOpen} setIsAutoCollect={setIsAutoCollect}
                                creatorId={
                                    selectedCreator?.id
                                }
                                showExpired={showExpired}  // Pass the showExpired state to MyPins component
                            />
                        )
                    }
                </Map>
                <PinToggle showExpired={showExpired} setShowExpired={setShowExpired} />

                <ManualPinButton handleClick={handleManualPinClick} />
                {creator.data && (
                    <div className="absolute top-2 left-2">
                        <label className="form-control w-full ">

                            <select
                                className="select select-bordered"
                                onChange={(e) => {

                                    const selectedCreator = creator.data.find((c) => c.id === e.target.value)
                                    if (selectedCreator) {
                                        setSelectedCreator(selectedCreator);

                                    }
                                }}
                            >
                                <option disabled={selectedCreator?.id ? true : false} value="">Select a Creator</option>
                                {creator.data.map((model) => (
                                    <option key={model.id} value={model.id}>{`${model.name}`}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}
                {
                    selectedCreator && (
                        <CreateAdminPinModal />
                    )
                }
            </APIProvider>
        </div>
    );
}



function ManualPinButton({ handleClick }: { handleClick: () => void }) {
    return (
        <div className="absolute bottom-24 right-2">
            <div className="btn" onClick={handleClick}>
                <MapPin /> Drop Pins
            </div>
        </div>
    );
}


const MyPins = memo(function MyPins({
    onOpen,
    setIsAutoCollect,
    creatorId,
    showExpired,
}: {
    onOpen: (type: ModalType, data?: ModalData) => void;
    setIsAutoCollect: (value: boolean) => void;
    creatorId: string;
    showExpired?: boolean;
}) {
    const { setAllPins } = useNearbyPinsStore();
    const pins = api.maps.pin.getCreatorPins.useQuery({
        creator_id: creatorId,
        showExpired
    });

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
                            className={`h-10 w-10 bg-white ${!pin.autoCollect ? "rounded-full " : ""
                                } ${pin._count.consumers <= 0 ? "opacity-100" : "opacity-50 "}`}
                        />
                    </AdvancedMarker>
                ))}
            </>
        );
    }
}
)
function PinToggle({
    showExpired,
    setShowExpired,
}: {
    showExpired: boolean
    setShowExpired: (value: boolean) => void
}) {
    return (
        <div className="absolute right-2 top-52 z-10 flex flex-col gap-2 rounded-lg bg-white p-3 shadow-lg md:right-4 md:top-40">
            <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="pin-toggle" className="text-sm font-medium">
                        Show Expired Pins
                    </Label>
                </div>
                <Switch id="pin-toggle" checked={showExpired} onCheckedChange={setShowExpired} />
            </div>
            <div className="text-xs text-gray-500">
                {showExpired ? "Showing all pins including expired" : "Showing only active pins"}
            </div>
        </div>
    )
}
export default AdminMap;
