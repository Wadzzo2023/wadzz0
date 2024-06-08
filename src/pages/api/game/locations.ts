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

  const db_locations = await db.location.findMany({
    select: { id: true, latitude: true, longitude: true, description: true },
  });

  interface Location {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
    brand_name: string;
    url: string;
    image_url: string;
    collected: boolean;

    collection_limit_remaining: number;
    auto_collect: boolean;
    brand_image_url: string;
    brand_id: number;
  }

  const locations: Location[] = db_locations.map((location) => {
    return {
      id: location.id,
      lat: location.latitude,
      lng: location.longitude,
      title: "San Francisco",
      description: location.description ?? "No description provided",
      brand_name: "Brand A",
      url: "https://picsum.photos/200/300",
      image_url: "https://picsum.photos/500/500",
      collected: false,
      collection_limit_remaining: 3,
      auto_collect: true,
      brand_image_url: "https://picsum.photos/100/100",
      brand_id: 1,
    };
  });

  res.status(200).json({ locations: locations });
}
