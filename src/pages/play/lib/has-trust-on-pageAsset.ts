import { BASE_URL } from "app/utils/Common";

export const HasTrustOnPageAsset = async ({
  brand_id,
}: {
  brand_id: string;
}) => {
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
      }
    );

    if (!response.ok) {
      throw new Error("Failed to  find trust on brand");
    }

    const data = await response.json();
    return data.hasTrust;
  } catch (error) {
    console.error("Failed to  find trust on brand", error);
    return error;
  }
};
