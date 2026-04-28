"use client";

import { memo, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import { useMapInteractionStore, useNearbyPinsStore } from "~/store/map-stores";
import { useSelectedAutoSuggestion } from "~/lib/state/play/use-selectedAutoSuggestion";
import { useCreatorStorageAcc } from "~/lib/state/wallete/stellar-balances";
import { api } from "~/utils/api";
import { getCookie } from "cookies-next";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { MapHeader } from "~/components/map/map-header";
import { NearbyLocationsPanel } from "~/components/map/nearby-locations-panel";
import { getPinIcon } from "~/utils/map-helpers";
import PinDetailAndActionsModal from "~/components/modals/pin-detail-modal";
import { useGeolocation } from "~/hooks/use-geolocation";
import { useMapState } from "~/hooks/use-map-state";
import { useMapInteractions } from "~/hooks/use-map-interactions";
import { usePinsData } from "~/hooks/use-pins-data";
import { PinType, type Location, type LocationGroup } from "@prisma/client";
import { MapControls } from "~/components/map/map-controls";
import AgentChat from "~/components/agent/AgentChat";
import { GoogleMapDrawing } from "~/components/map/google-map-drawing";
import CreatePinModal from "~/components/modals/create-pin-modal";
import CreateHotspotModal from "~/components/modals/create-hotspot-modal";
import HotspotDetailModal from "~/components/modals/hotspot-details-modal";

type Pin = Location & {
  locationGroup:
    | (LocationGroup & {
        creator: { profileUrl: string | null };
      })
    | null;
  _count: {
    consumers: number;
  };
};

type DrawingMode = "polygon" | "rectangle" | "circle";

// ─── Inner component lives inside <Map> so useMap() works ────────────────────
function MapDrawingLayer({
  isCreatingHotspot,
  onSelectionChange,
  onClose,
  mapContainerRef,
}: {
  isCreatingHotspot: boolean;
  onSelectionChange: (
    feature: GeoJSON.Feature | null,
    activeMode: DrawingMode,
  ) => void;
  onClose: () => void;
  mapContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const map = useMap(); // ✅ called inside <Map> tree

  if (!isCreatingHotspot || !mapContainerRef.current || !map) return null;

  return (
    <GoogleMapDrawing
      map={map}
      onSelectionChange={onSelectionChange}
      onClose={onClose}
      mapElement={mapContainerRef.current}
    />
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
function CreatorMapDashboardContent() {
  const {
    duplicate,
    setManual,
    position,
    setPosition,
    openCreatePinModal,
    openPinDetailModal,
    setPrevData,
    isPinCopied,
    isPinCut,
    copiedPinData,
    setIsAutoCollect,
  } = useMapInteractionStore();

  const { setBalance } = useCreatorStorageAcc();
  const {
    mapZoom,
    setMapZoom,
    mapCenter,
    setMapCenter,
    centerChanged,
    setCenterChanged,
    isCordsSearch,
    setIsCordsSearch,
    searchCoordinates,
    setSearchCoordinates,
    cordSearchCords,
    setCordSearchCords,
  } = useMapState();

  const [showExpired, setShowExpired] = useState<boolean>(false);
  const [openHostpotModal, setOpenHotspotModal] = useState(false);
  const [hotspotData, setHotspotData] = useState<GeoJSON.Feature | null>(null);
  const [selectedShape, setSelectedShape] = useState<
    "circle" | "rectangle" | "polygon"
  >("polygon");
  const [isCreatingHotspot, setIsCreatingHotspot] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
const [layoutMode] = useState<"modern" | "legacy">(() => {
  const cookieMode = getCookie("wadzzo-layout-mode");
  if (cookieMode === "legacy" || cookieMode === "modern") {
    return cookieMode;
  }
  return "modern";
});
  const { filterNearbyPins } = useNearbyPinsStore();
  const { selectedPlace: alreadySelectedPlace } = useSelectedAutoSuggestion();

  const handleCreateHotspot = () => setIsCreatingHotspot(true);

  const handleHotspotSelection = (
    feature: GeoJSON.Feature | null,
    activeMode: DrawingMode,
  ) => {
    setOpenHotspotModal(true);
    setHotspotData(feature);
    setSelectedShape(activeMode);
    setIsCreatingHotspot(false);
  };

  useGeolocation(setMapCenter, setMapZoom);
  usePinsData(showExpired);

  const { handleMapClick, handleZoomIn, handleZoomOut, handleDragEnd } =
    useMapInteractions({
      setManual,
      setPosition,
      openCreatePinModal,
      openPinDetailModal,
      isPinCopied,
      isPinCut,
      duplicate,
      copiedPinData,
      setMapZoom,
      mapZoom,
      filterNearbyPins: (bounds) => filterNearbyPins(bounds, "my"),
      centerChanged,
    });

  api.wallate.acc.getCreatorStorageBallances.useQuery(undefined, {
    onSuccess: (data) => setBalance(data),
    onError: (error) =>
      console.error("Failed to fetch creator storage balances:", error),
    refetchOnWindowFocus: false,
  });

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
  }, [alreadySelectedPlace, setMapCenter, setMapZoom, setPosition]);

  useEffect(() => {
    if (position) {
      setMapCenter(position);
      setMapZoom(14);
    }
  }, [position, setMapCenter, setMapZoom]);

  const handleManualPinClick = () => {
    setManual(true);
    setPosition(undefined);
    setPrevData(undefined);
    openCreatePinModal();
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
      <MapHeader
        showCreatorList={false}
        showExpired={showExpired}
        setShowExpired={setShowExpired}
        onManualPinClick={handleManualPinClick}
        onPlaceSelect={(place) => {
          setMapCenter({ lat: place.lat, lng: place.lng });
          setMapZoom(13);
          setPosition({ lat: place.lat, lng: place.lng });
          setIsCordsSearch(false);
        }}
        onCenterChange={setMapCenter}
        setIsCordsSearch={setIsCordsSearch}
        setSearchCoordinates={setSearchCoordinates}
        setCordSearchLocation={setCordSearchCords}
        setZoom={setMapZoom}
        onCreateHotspot={handleCreateHotspot}
      />

      <div
        className={`relative ${layoutMode === "modern" ? "h-screen" : "h-full"} w-full max-h-screen overflow-hidden`}
        ref={mapContainerRef}
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-slate-900/5 via-transparent to-transparent" />

        <Map
          onCenterChanged={(center) => {
            setMapCenter(center.detail.center);
            setCenterChanged(center.detail.bounds);
          }}
          onZoomChanged={(zoom) => setMapZoom(zoom.detail.zoom)}
          onClick={handleMapClick}
          mapId={"bf51eea910020fa25a"}
          className="h-full w-full transition-all duration-500 ease-out"
          defaultCenter={{ lat: 22.54992, lng: 0 }}
          defaultZoom={3}
          minZoom={3}
          zoom={mapZoom}
          center={mapCenter}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          onDragend={handleDragEnd}
        >
          {position && !isCordsSearch && (
            <Marker position={{ lat: position.lat, lng: position.lng }} />
          )}

          {isCordsSearch && searchCoordinates && (
            <AdvancedMarker position={searchCoordinates}>
              <div className="animate-bounce">
                <MapPin className="size-8 text-red-500 drop-shadow-lg" />
              </div>
            </AdvancedMarker>
          )}

          {isCordsSearch && cordSearchCords && (
            <AdvancedMarker position={cordSearchCords}>
              <div className="animate-bounce">
                <MapPin className="size-8 text-red-500 drop-shadow-lg" />
              </div>
            </AdvancedMarker>
          )}

          {!isCreatingHotspot && (
            <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          )}

          <MyPins
            onPinClick={(pin) => {
              openPinDetailModal(pin);
              setIsAutoCollect(pin.autoCollect);
            }}
            showExpired={showExpired}
          />
          <MyHotspots />

          {/* ✅ MapDrawingLayer is inside <Map>, so useMap() returns the instance */}
          <MapDrawingLayer
            isCreatingHotspot={isCreatingHotspot}
            onSelectionChange={handleHotspotSelection}
            onClose={() => setIsCreatingHotspot(false)}
            mapContainerRef={mapContainerRef}
          />
        </Map>
      </div>

      {!isCreatingHotspot && (
        <NearbyLocationsPanel
          onSelectPlace={(coords) => {
            setMapCenter(coords);
            setMapZoom(13);
            setPosition(coords);
          }}
        />
      )}

      <CreatePinModal />
      <PinDetailAndActionsModal />
      <AgentChat />

      {openHostpotModal && (
        <CreateHotspotModal
          isOpen={openHostpotModal}
          setIsOpen={setOpenHotspotModal}
          hotspotData={hotspotData}
          shape={selectedShape}
        />
      )}
    </APIProvider>
  );
}

export default CreatorMapDashboardContent;

// ─── MyPins ───────────────────────────────────────────────────────────────────
const MyPins = memo(function MyPins({
  onPinClick,
  showExpired,
}: {
  onPinClick: (pin: Pin) => void;
  showExpired: boolean;
}) {
  const { myPins, setMyPins } = useNearbyPinsStore();
  const pinsQuery = api.maps.pin.getMyPins.useQuery({ showExpired });

  useEffect(() => {
    if (pinsQuery.data) setMyPins(pinsQuery.data);
  }, [pinsQuery.data, setMyPins]);

  if (pinsQuery.isLoading) return null;

  return (
    <>
      {myPins.map((pin) => {
        const PinIcon = getPinIcon(pin.locationGroup?.type ?? PinType.OTHER);

        const isExpired =
          (pin.locationGroup?.endDate &&
            new Date(pin.locationGroup.endDate) < new Date()) ??
          false;
        const isApproved = pin.locationGroup?.approved === true;
        const isRemainingZero =
          pin.locationGroup?.remaining !== undefined &&
          pin.locationGroup?.remaining <= 0;
        const isHidden = pin.hidden === true;
        const isAutoCollect = pin.autoCollect === true;

        const isInactive = isExpired || isRemainingZero || !isApproved;
        const showAnimation =
          !isExpired && !isRemainingZero && isApproved && !isHidden;

        const baseClasses =
          "relative flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-125 hover:shadow-2xl cursor-pointer group transform hover:-translate-y-1";
        const opacityClasses = isHidden
          ? "opacity-40"
          : isInactive
            ? "opacity-50"
            : "opacity-100";
        const shapeClasses = isAutoCollect ? "rounded-none" : "rounded-full";
        const borderClasses = isHidden
          ? "border-dashed border-red-500 border-2"
          : isApproved
            ? "ring-2 ring-green-400"
            : "";
        const filterClasses = isInactive && !isHidden ? "grayscale" : "";
        const bgClasses =
          !isApproved && !isHidden
            ? "bg-gray-500"
            : "bg-white/80 hover:bg-white/100";

        return (
          <AdvancedMarker
            key={pin.id}
            position={{ lat: pin.latitude, lng: pin.longitude }}
            onClick={() => onPinClick(pin)}
          >
            <div
              className={`${baseClasses} ${opacityClasses} ${shapeClasses} ${borderClasses} ${filterClasses} ${bgClasses}`}
            >
              {showAnimation && (
                <div
                  className={`absolute inset-0 animate-ping bg-blue-400 opacity-20 ${shapeClasses}`}
                />
              )}

              {pin.locationGroup?.creator.profileUrl ? (
                <img
                  src={
                    pin.locationGroup.creator.profileUrl ?? "/placeholder.svg"
                  }
                  width={32}
                  height={32}
                  alt="Creator"
                  className={`h-12 w-12 ${shapeClasses} object-cover ring-2 transition-all duration-300`}
                />
              ) : (
                <div
                  className={`h-12 w-12 ${shapeClasses} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ring-2 transition-all duration-300`}
                >
                  <PinIcon className="h-6 w-6 text-gray-600 transition-colors duration-300" />
                </div>
              )}

              {pin._count.consumers > 0 && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white shadow-lg">
                  {pin._count.consumers > 99 ? "99+" : pin._count.consumers}
                </div>
              )}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
});

// ---- My Hotspot --------------------------------------------------------------

// ---- My Hotspot --------------------------------------------------------------

type HotspotGeoJson = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "Circle" | "Rectangle";
    coordinates: [number, number][][];
  };
  properties: {
    center?: [number, number];
    radiusMetres?: number;
  } | null;
};

const MyHotspots = memo(function MyHotspots() {
  const map = useMap();
  const hotspotQuery = api.maps.pin.myHotspots.useQuery();
  const overlaysRef = useRef<
    (google.maps.Polygon | google.maps.Circle | google.maps.Rectangle)[]
  >([]);

  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [showHotspotModal, setShowHotspotModal] = useState(false);

  useEffect(() => {
    if (!map || !hotspotQuery.data) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    hotspotQuery.data.forEach((hs) => {
      const geoJson = hs.geoJson as HotspotGeoJson;
      if (!geoJson?.geometry) return;

      const isActive = hs.isActive;
      const isAutoCollect = hs.autoCollect;

      const shapeOptions = {
        map,
        strokeColor: isAutoCollect ? "#22c55e" : "#3b82f6",
        strokeOpacity: isActive ? 0.9 : 0.4,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: isActive ? 0.2 : 0.05,
      };

      let overlay:
        | google.maps.Polygon
        | google.maps.Circle
        | google.maps.Rectangle;

      if (hs.shape === "circle") {
        const props = geoJson.properties;
        if (!props?.center || !props?.radiusMetres) return;
        overlay = new window.google.maps.Circle({
          ...shapeOptions,
          center: { lat: props.center[0], lng: props.center[1] },
          radius: props.radiusMetres,
        });
      } else if (hs.shape === "rectangle") {
        const coords = geoJson.geometry.coordinates[0];
        const lats = coords.map(([lat]) => lat);
        const lngs = coords.map(([, lng]) => lng);
        const bounds = new window.google.maps.LatLngBounds(
          { lat: Math.min(...lats), lng: Math.min(...lngs) },
          { lat: Math.max(...lats), lng: Math.max(...lngs) },
        );
        overlay = new window.google.maps.Rectangle({ ...shapeOptions, bounds });
      } else {
        const coords = geoJson.geometry.coordinates[0];
        const paths = coords.map(([lat, lng]) => ({ lat, lng }));
        overlay = new window.google.maps.Polygon({ ...shapeOptions, paths });
      }

      overlay.addListener("click", () => {
        setSelectedHotspot(hs.id);
        setShowHotspotModal(true);
      });

      overlaysRef.current.push(overlay);
    });

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
    };
  }, [map, hotspotQuery.data]);

  return (
    <>
      {/* the overlays are drawn in the effect above; this component
          doesn’t render anything itself */}
      <HotspotDetailModal
        isOpen={showHotspotModal}
        setIsOpen={setShowHotspotModal}
        hotspotId={selectedHotspot}
      />
    </>
  );
});
