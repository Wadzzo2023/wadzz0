import { BASE_URL } from "~/lib/common";

export const getUserPlatformAsset = async () => {
  try {
    const response = await fetch(
      new URL("api/game/user/userBalance", BASE_URL).toString(),
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (response.ok) {
      const data = (await response.json()) as number;
      return data;
    }
  } catch (error) {
    console.error("Failed to fetch User Balance:", error);
    throw new Error("Failed to fetch User Balance");
  }
};
