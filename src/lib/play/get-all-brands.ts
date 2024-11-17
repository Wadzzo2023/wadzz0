import { BASE_URL } from "~/lib/common";
import { Brand } from "~/types/game/brand";

export const getAllBrands = async () => {
  try {
    const response = await fetch(
      new URL("api/game/brands", BASE_URL).toString(),
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (!response.ok) {
      console.log("Failed to fetch collections");
    }

    const data = await response.json() as { users: Brand[] };

    return data;
  } catch (error) {
    console.error("Error fetching collections:", error);
  }
};
