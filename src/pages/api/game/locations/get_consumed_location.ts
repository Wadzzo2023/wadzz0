import { WadzzoIconURL } from './index';
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { db } from "~/server/db";
import { ConsumedLocation, Location } from "~/types/game/location";
import { avaterIconUrl } from "../brands";


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
  const consumedLocations = await db.locationConsumer.findMany({
    where: {
      userId: session.user.id,
      hidden: false
    },
    include: { location: { include: { creator: true } } },
  });

  const locations: ConsumedLocation[] = consumedLocations.map((consumption) => {
    return {
      id: consumption.location.id,
      lat: consumption.location.latitude,
      lng: consumption.location.longitude,
      title: consumption.location.title,
      description:
        consumption.location.description ?? "No description provided",
      brand_name: consumption.location.creator.name,
      url: consumption.location.link ?? "https://app.wadzzo.com/",
      image_url:
        consumption.location.image ??
        consumption.location.creator.profileUrl ??
        WadzzoIconURL,
      collected: false,
      collection_limit_remaining: 3,
      auto_collect: true,
      brand_image_url: consumption.location.creator.profileUrl ?? avaterIconUrl,
      brand_id: consumption.location.creator.id,
      modal_url: "https://vong.cong/",
      viewed: consumption.viewedAt != null,
    };
  });

  res.status(200).json({ locations: locations });
}
