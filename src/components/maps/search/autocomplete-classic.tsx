import React, { useRef, useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useSelectedAutoSuggestion } from "~/lib/state/map/useSelectedAutoSuggestion";

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  onCenterChange: (latLng: google.maps.LatLngLiteral) => void; // Callback to set map center
  setIsCordsSearch: (isCordsSearch: boolean) => void;
  setCordSearchLocation: (location: google.maps.LatLngLiteral) => void;
}

// This is an example of the classic "Place Autocomplete" widget.
// https://developers.google.com/maps/documentation/javascript/place-autocomplete
export const PlaceAutocompleteClassic = ({
  onPlaceSelect,
  onCenterChange,
  setIsCordsSearch,
  setCordSearchLocation,
}: Props) => {
  const { setSelectedPlace } = useSelectedAutoSuggestion();

  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ["geometry", "name", "formatted_address"],
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener("place_changed", () => {
      const place = placeAutocomplete.getPlace();
      onPlaceSelect(place);

      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat !== undefined && lng !== undefined) {
        const latLng = { lat, lng };
        setSelectedPlace(latLng);
        onCenterChange(latLng); // Center map on selected place
      }
    });
  }, [onPlaceSelect, placeAutocomplete, setSelectedPlace, onCenterChange]);

  // Function to check if input is coordinates and set center
  const handleCoordinatesInput = () => {
    if (inputRef.current) {
      const value = inputRef.current.value.trim();
      const [latStr, lngStr] = value.split(",").map((str) => str.trim());
      const lat = Number(latStr);
      const lng = Number(lngStr);

      if (!isNaN(lat) && !isNaN(lng)) {
        const latLng: google.maps.LatLngLiteral = { lat, lng };
        onCenterChange(latLng);
        setSelectedPlace(latLng);
        setIsCordsSearch(true);
        setCordSearchLocation(latLng);
      } else {
        console.error(
          "Invalid coordinates. Please enter valid latitude and longitude.",
        );
      }
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        placeholder="Enter a location or coordinates"
        type="text"
        className="h-12 w-80 rounded-lg border-2 border-gray-300 p-2"
        onKeyDown={(e) => e.key === "Enter" && handleCoordinatesInput()}
      />
    </div>
  );
};
