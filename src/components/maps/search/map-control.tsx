import React from "react";
import { ControlPosition, MapControl } from "@vis.gl/react-google-maps";

import { PlaceAutocompleteClassic } from "./autocomplete-classic";

type CustomAutocompleteControlProps = {
  controlPosition: ControlPosition;
  onCenterChange: (center: google.maps.LatLngLiteral) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  setIsCordsSearch: (isCordsSearch: boolean) => void;
  setCordSearchLocation: (location: google.maps.LatLngLiteral) => void;
};

export const CustomMapControl = ({
  controlPosition,
  onPlaceSelect,
  onCenterChange,
  setIsCordsSearch,
  setCordSearchLocation,
}: CustomAutocompleteControlProps) => {
  return (
    <MapControl position={controlPosition}>
      <div className="autocomplete-control w-full">
        <PlaceAutocompleteClassic
          onPlaceSelect={onPlaceSelect}
          onCenterChange={onCenterChange}
          setIsCordsSearch={setIsCordsSearch}
          setCordSearchLocation={setCordSearchLocation}
        />
      </div>
    </MapControl>
  );
};
