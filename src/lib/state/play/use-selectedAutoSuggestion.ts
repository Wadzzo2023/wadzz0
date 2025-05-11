import { create } from "zustand";

interface AutoSuggestionStore {
  selectedPlace: google.maps.LatLngLiteral | null;
  setSelectedPlace: (place: google.maps.LatLngLiteral | null) => void;
}
export const useSelectedAutoSuggestion = create<AutoSuggestionStore>((set) => ({
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
}));
