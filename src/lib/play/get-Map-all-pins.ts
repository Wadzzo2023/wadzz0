import { BASE_URL } from "~/lib/common";
import { ConsumedLocation } from "~/types/game/location";

export const getMapAllPins = async ({ filterID }: { filterID: string }) => {
  console.log("filterID", filterID);
  try {
    const url = new URL(`api/game/locations`, BASE_URL);
    url.searchParams.append("filterId", filterID);

    const response = await fetch(url.toString(), {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch pins");
    }
    const data = (await response.json()) as { locations: ConsumedLocation[] };
    return data;
  } catch (error) {
    console.error("Error fetching pins:", error);
    throw error;
  }
};
