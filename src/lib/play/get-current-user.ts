import { User } from "@prisma/client";
import { BASE_URL } from "../common";

export const getCurrentUser = async () => {
  try {
    const response = await fetch(
      new URL("api/game/user", BASE_URL).toString(),
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (response.ok) {
      throw new Error("Failed to fetch current user");
    }

    const data = (await response.json()) as User;

    return data;
  } catch (error) {
    throw error;
  }
};
