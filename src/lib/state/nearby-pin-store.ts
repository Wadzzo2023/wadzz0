import { create } from "zustand";
import type { Location, LocationGroup } from "@prisma/client";

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
  myPins: Pin[];
  setMyPins: (pins: Pin[]) => void;
  setNearbyPins: (pins: Pin[]) => void;
  filterNearbyPins: (
    center: google.maps.LatLngBoundsLiteral,
    source?: "my" | "admin",
  ) => void;
}

export const useNearbyPinsStore = create<NearbyPinsState>((set, get) => ({
  nearbyPins: [],
  myPins: [],

  setNearbyPins: (pins: Pin[]) => set({ nearbyPins: pins }),

  setMyPins: (pins: Pin[]) => {
    const currentPins = get().myPins;
    if (
      pins.length !== currentPins.length ||
      pins.map((pin) => pin.id).join(",") !==
        currentPins.map((pin) => pin.id).join(",")
    ) {
      set({ myPins: pins });
    }
  },

  filterNearbyPins: (
    center: google.maps.LatLngBoundsLiteral,
    source?: "my" | "admin",
  ) => {
    const { myPins, nearbyPins } = get();
    const sourcePins = source === "my" ? myPins : myPins;
    const filtered = sourcePins.filter(
      (pin) =>
        pin.latitude >= center.south &&
        pin.latitude <= center.north &&
        pin.longitude >= center.west &&
        pin.longitude <= center.east,
    );
    if (
      filtered.length !== nearbyPins.length ||
      filtered.map((pin) => pin.id).join(",") !==
        nearbyPins.map((pin) => pin.id).join(",")
    ) {
      set({ nearbyPins: filtered });
    }
  },
}));
