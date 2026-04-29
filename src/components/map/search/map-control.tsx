"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Input } from "~/components/shadcn/ui/input";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface CustomMapControlProps {
  children: React.ReactNode;
  onPlaceSelect: (place: { lat: number; lng: number }) => void;
  onCenterChange: (center: google.maps.LatLngLiteral) => void;
  setIsCordsSearch: (value: boolean) => void;
  setSearchCoordinates: (coords: google.maps.LatLngLiteral | undefined) => void;
  setCordSearchLocation: (
    coords: google.maps.LatLngLiteral | undefined,
  ) => void;
  setZoom: (zoom: number) => void;
}

export function CustomMapControl({
  children,
  onPlaceSelect,
  onCenterChange,
  setIsCordsSearch,
  setSearchCoordinates,
  setCordSearchLocation,
  setZoom,
}: CustomMapControlProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

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
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const latLng = { lat, lng };

        onPlaceSelect(latLng);
        setInputValue(place.formatted_address ?? place.name ?? "");
        onCenterChange(latLng);
        setZoom(16);
        setIsCordsSearch(false);
        setSearchCoordinates(undefined);
        setCordSearchLocation(undefined);
      }
    });
  }, [
    onPlaceSelect,
    placeAutocomplete,
    onCenterChange,
    setZoom,
    setIsCordsSearch,
    setSearchCoordinates,
    setCordSearchLocation,
  ]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCoordinatesInput();
    }
  };

  const handleBlur = () => {
    handleCoordinatesInput();
  };

  const handleCoordinatesInput = () => {
    const value = inputValue.trim();
    const parts = value.split(",").map((str) => str.trim());

    if (parts.length === 2) {
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);

      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        const latLng: google.maps.LatLngLiteral = { lat, lng };
        onCenterChange(latLng);
        setIsCordsSearch(true);
        setCordSearchLocation(latLng);
        setSearchCoordinates(latLng);
        setZoom(16);
        return;
      }
    }
  };

  const inputElement = React.Children.only(children) as React.ReactElement<
    React.ComponentProps<typeof Input>
  >;

  return React.cloneElement(inputElement, {
    ref: inputRef,
    value: inputValue,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
  });
}
