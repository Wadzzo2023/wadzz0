import { BASE_URL } from "~/lib/common";

export const HasTrustOnPageAsset = async ({
  brand_id,
}: {
  brand_id: string;
}) => {
  console.log("brand_id xx api", brand_id);
  try {
    const response = await fetch(
      new URL("api/game/hasTrustOnBrand", BASE_URL).toString(),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand_id: brand_id.toString() }),
      },
    );

    if (!response.ok) {
      // throw new Error("Failed to  find trust on brand");
      return false;
    }

    const data = (await response.json()) as { hasTrust: boolean };
    return data.hasTrust;
  } catch (error) {
    console.error("Failed to  find trust on brand", error);
    return false;
  }
};
