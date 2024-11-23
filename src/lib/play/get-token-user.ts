import { User } from "@prisma/client";
import { BASE_URL } from "~/lib/common";

export const getTokenUser = async () => {
  try {
    const response = await fetch(
      new URL("api/game/user/token", BASE_URL).toString(),
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (!response.ok) {
      console.log("Failed to fetch user");
    }

    const data = await response.json() as User;

    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
