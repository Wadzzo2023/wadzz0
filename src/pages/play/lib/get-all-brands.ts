import { BASE_URL } from "app/utils/Common";

export const getAllBrands = async () => {
    try {
        const response = await fetch(
            new URL("api/game/brands", BASE_URL).toString(),
            {
                method: "GET",
                credentials: "include",
            }
        );
        if (!response.ok) {
            console.log("Failed to fetch collections");
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error fetching collections:", error);

    }
};
