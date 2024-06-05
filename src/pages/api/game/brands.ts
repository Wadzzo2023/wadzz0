import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import internal from "stream";
import { db } from "~/server/db";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getSession({ req });

  // Check if the user is authenticated
  if (!session) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  // Return the locations

  //   const db_locations = await db.location.findMany({
  //     select: { id: true, latitude: true, longitude: true, description: true },
  //   });

  const brands = await db.creator.findMany({
    select: {
      id: true,
      name: true,
      profileUrl: true,
      pageAsset: { select: { code: true, thumbnail: true } },
    },
    where: { pageAsset: {} },
  });

  interface Brand {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    logo: string;
  }

  const bands: Brand[] = brands.map((brand) => {
    return {
      id: brand.id,
      first_name: brand.name,
      last_name: brand.name,
      email: "",
      logo: brand.pageAsset?.thumbnail ?? "https://picsum.photos/200/300",
    };
  });

  //   const users: Brand[] = db_locations.map((location) => {
  //     return {
  //       id: location.id,
  //       lat: location.latitude,
  //       lng: location.longitude,
  //       title: "San Francisco",
  //       description: location.description ?? "No description provided",
  //       brand_name: "Brand A",
  //       url: "https://picsum.photos/200/300",
  //       image_url: "https://picsum.photos/500/500",
  //       collected: false,
  //       collection_limit_remaining: 3,
  //       auto_collect: true,
  //       brand_image_url: "https://picsum.photos/100/100",
  //       brand_id: 1,
  //     };
  //   });

  res.status(200).json({ users: bands });
}
