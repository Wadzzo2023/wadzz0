import { BASE_URL } from "~/lib/common";

export const GetXDR4Follow = async ({
  brand_id,
  wallate,
}: {
  brand_id: string;
  wallate: string;
}) => {
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
    },
  );

  if (getXRDResponse.status === 200) {
    const xdr = (await getXRDResponse.json()) as { xdr: string };
    if (xdr.xdr) {
      return xdr.xdr;
    }
  } else {
    const errorData = (await getXRDResponse.json()) as { error: string };
    throw new Error(errorData.error);
  }
};
