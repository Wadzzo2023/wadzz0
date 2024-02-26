import { type Hit } from "@algolia/client-search";
import { type AssetType } from "../interfaces";

type WithAutocompleteAnalytics<THit> = THit & {
  __autocomplete_indexName: string;
  __autocomplete_queryID: string;
};

export type AssetTypeHit = WithAutocompleteAnalytics<Hit<AssetType>> &
  Record<string, unknown>;
