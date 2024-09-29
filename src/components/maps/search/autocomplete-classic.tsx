import React, { useRef, useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import CreatePinModal from "../modals/create-pin";
import { useSelectedAutoSuggestion } from "~/components/hooks/use-selectedAutoSuggestion";

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

// This is an example of the classic "Place Autocomplete" widget.
// https://developers.google.com/maps/documentation/javascript/place-autocomplete
export const PlaceAutocompleteClassic = ({ onPlaceSelect }: Props) => {
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

      const latLng = {
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      };

      if (latLng.lat && latLng.lng) {
        setSelectedPlace(latLng as google.maps.LatLngLiteral);
      }
    });
  }, [onPlaceSelect, placeAutocomplete, setSelectedPlace]);

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        placeholder="Enter a location"
        type="text"
        className="h-8 w-80 rounded-lg border-2 border-gray-300 p-2"
      />
    </div>
  );
};
