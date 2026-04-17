"use client";
import { Search, Plus, Target } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/shadcn/ui/select";
import { CustomMapControl } from "~/components/map/search/map-control";
import { PinToggleSwitch } from "./pin-toggle-switch";
import { api } from "~/utils/api";
import { useSelectCreatorStore } from "~/components/store/creator-selection-store";

interface MapHeaderProps {
  showExpired: boolean;
  showCreatorList: boolean;
  onPlaceSelect: (place: { lat: number; lng: number }) => void;
  onCenterChange: (center: google.maps.LatLngLiteral) => void;
  setIsCordsSearch: (value: boolean) => void;
  setSearchCoordinates: (coords: google.maps.LatLngLiteral | undefined) => void;
  setCordSearchLocation: (
    coords: google.maps.LatLngLiteral | undefined,
  ) => void;
  setZoom: (zoom: number) => void;
  setShowExpired: (value: boolean) => void;
  onManualPinClick: () => void;
  onCreateHotspot?: () => void;
}

export function MapHeader({
  showCreatorList = false,
  onPlaceSelect,
  onCenterChange,
  setIsCordsSearch,
  setSearchCoordinates,
  setCordSearchLocation,
  setZoom,
  showExpired,
  setShowExpired,
  onManualPinClick,
  onCreateHotspot,
}: MapHeaderProps) {
  const creator = api.fan.creator.getCreators.useQuery(undefined, {
    enabled: showCreatorList,
  });
  const { setData: setSelectedCreator, data: selectedCreator } =
    useSelectCreatorStore();

  return (
    <div className="absolute left-0 right-0 top-24 z-30 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          {showCreatorList && creator.data && (
            <div className="w-64 shrink-0">
              <Select
                value={selectedCreator?.id}
                onValueChange={(value) => {
                  const selectedCreator = creator.data.find(
                    (c) => c.id === value,
                  );
                  if (selectedCreator) {
                    console.log("Selected creator:", selectedCreator);
                    setSelectedCreator(selectedCreator);
                  }
                }}
                defaultValue={selectedCreator?.id}
              >
                <SelectTrigger className="rounded-xl border-white/30 bg-white/80 shadow-lg backdrop-blur-md">
                  <SelectValue placeholder="Select a creator" />
                </SelectTrigger>
                <SelectContent>
                  {creator.data.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name ?? model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <PinToggleSwitch
            showExpired={showExpired}
            setShowExpired={setShowExpired}
          />

          <div className="flex-1 ">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl border border-white/30 bg-white/80 shadow-lg backdrop-blur-md" />
              <div className="relative flex items-center  ">
                <Search className="absolute left-4 z-10 h-5 w-5 text-gray-400" />
                <CustomMapControl
                  onPlaceSelect={onPlaceSelect}
                  onCenterChange={onCenterChange}
                  setIsCordsSearch={setIsCordsSearch}
                  setSearchCoordinates={setSearchCoordinates}
                  setCordSearchLocation={setCordSearchLocation}
                  setZoom={setZoom}
                >
                  <Input
                    placeholder="Search locations, brands..."
                    className="h-12 w-full rounded-2xl border-0 bg-transparent pl-12 pr-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
                  />
                </CustomMapControl>
              </div>
            </div>
          </div>

          {(!showCreatorList || (showCreatorList && selectedCreator)) && (
            <div className="flex gap-2">
              {onCreateHotspot && (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-blue-600 px-3 hover:bg-blue-700 md:rounded-2xl md:px-6"
                  onClick={onCreateHotspot}
                  aria-label="Create hotspot area selection"
                >
                  <Target className="h-5 w-5" />
                  <span className="hidden md:block"> Create Hotspot</span>
                </Button>
              )}
              <Button
                variant="default"
                size="lg"
                className="px-3 md:rounded-2xl md:px-6"
                onClick={onManualPinClick}
                aria-label="Create manual pin"
              >
                <Plus className="" />
                <span className="hidden md:block"> Create Pin</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
