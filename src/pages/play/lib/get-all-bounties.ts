import { Bounty } from "@prisma/client";
import { BASE_URL } from "~/lib/common";

export const getAllBounties = async () => {
    try {
        const response = await fetch(
            new URL("api/game/bounty", BASE_URL).toString(),
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (response.ok) {
            const data = await response.json() as { bounty: Bounty[] };
            return data;
        }

    } catch (error) {
        console.error("Error fetching bounties:", error);
        throw error;
    }
};
