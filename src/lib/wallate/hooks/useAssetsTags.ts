import { useRef, useState } from "react";
import type { GetTagsType, Tag } from "../interfaces";
import axios, { type AxiosResponse } from "axios";
import { TAG_SIZE } from "../constants";

export default function useAssetTags() {
  const lastPoint = useRef<null | string>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  async function getData() {
    setError(false);
    try {
      const raw: AxiosResponse<GetTagsType> = await axios.get(`/api/get-tags`, {
        params: {
          point: lastPoint.current,
        },
      });

      const combinedItems = tags.concat(raw.data.tags || []);

      setHasMoreItems(raw.data.tags.length >= TAG_SIZE);

      const lastAsset = raw.data.tags[raw.data.tags.length - 1];
      if (lastAsset) {
        lastPoint.current = lastAsset.name;
      }
      setTags(combinedItems);
    } catch (error) {
      console.error(error);
      setError(true);
    }
  }

  return { tags, getData, hasMoreItems, error };
}
