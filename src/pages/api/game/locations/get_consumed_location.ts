import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { db } from "~/server/db";
import { Location } from "~/types/game/location";

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
    select: {
      id: true,
      latitude: true,
      longitude: true,
      description: true,
      creatorId: true,
    },
  });

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
      brand_id: location.creatorId,
    };
  });

  res.status(200).json({ locations: locations });
}
