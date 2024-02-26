import { create } from "zustand";
import type { AssetType } from "../interfaces";
import { type AutocompleteState } from "@algolia/autocomplete-core";
import { type AssetTypeHit } from "../types/HitTypes";
import { AUTO_COMPLETE_STATUS_DEFAULT } from "../defaults";

interface SearchAssetsState {
  assets: AssetType[];
  autocompleteState: AutocompleteState<AssetTypeHit>;
  setAssets: (assets: AssetType[]) => void;
  setAutocompleteState: (
    autocompleteState: AutocompleteState<AssetTypeHit>,
  ) => void;
}

export const useSearchAssetsStore = create<SearchAssetsState>((set) => ({
  autocompleteState: AUTO_COMPLETE_STATUS_DEFAULT,
  assets: [],
  setAssets: (assets) => set({ assets }),
  setAutocompleteState: (autocompleteState) => set({ autocompleteState }),
}));
