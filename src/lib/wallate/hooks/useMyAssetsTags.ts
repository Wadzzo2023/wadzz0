import { useRef, useState } from "react";
import type { GetTagsType, Tag } from "../interfaces";
import axios, { type AxiosResponse } from "axios";
import { MY_TAG_ITEM_SIZE } from "../constants";
import { useMySearchArrayStore } from "~/lib/state/wallete/my_search_array";

export default function useMyAssetTags() {
  const pageNo = useRef<number>(1);
  const isRunning = useRef(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const { value: rSearchArray } = useMySearchArrayStore();

  async function getData() {
    if (isRunning.current) return;
    setError(false);
    isRunning.current = true;

    try {
      const limitShow = MY_TAG_ITEM_SIZE * pageNo.current;
      const searchArray = rSearchArray.slice(
        limitShow - MY_TAG_ITEM_SIZE,
        limitShow,
      );

      const raw: AxiosResponse<GetTagsType> = await axios.post(
        `/api/get-my-tags`,
        { searchArray },
      );

      const combinedItems = tags.concat(raw.data.tags || []);

      setHasMoreItems(!(limitShow >= rSearchArray.length));
      pageNo.current++;
      setTags(combinedItems);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      isRunning.current = false;
    }
  }

  return { tags, getData, hasMoreItems, error };
}
