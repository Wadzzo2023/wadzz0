import { BASE_URL } from "app/utils/Common";

export const GetXDR4Follow = async ({
  brand_id,
  wallate,
}: {
  brand_id: string;
  wallate: string;
}) => {
  try {
    const getXRDResponse = await fetch(
      new URL("api/game/getFollowXDR", BASE_URL).toString(),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand_id: brand_id?.toString(),
          wallate: wallate,
        }),
      }
    );
    const xdr = await getXRDResponse.json();

    if (getXRDResponse.status === 200) {
      if (xdr.xdr) {
        return xdr.xdr;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error failed to follow brand:", error);
    return null;
  }
};
