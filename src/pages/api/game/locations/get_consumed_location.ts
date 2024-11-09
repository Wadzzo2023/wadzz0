import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";
import { ConsumedLocation } from "~/types/game/location";
import { avaterIconUrl } from "../brands";
import { WadzzoIconURL } from "./index";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);

  const session = await getToken({ req });

  // Check if the user is authenticated
  if (!session) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  // Return the locations
  /*
    const consumedLocations = await db.locationConsumer.findMany({
      where: {
        userId: session.user.id,
        hidden: false,
      },
      include: { location: { include: { creator: true } } },
    });
  */

  // location
  const dbLocations = await db.location.findMany({
    select: {
      id: true,
      link: true,
      latitude: true,
      longitude: true,
      description: true,
      creatorId: true,
      title: true,
      limit: true,

      consumers: {
        select: { userId: true, viewedAt: true },
        where: { userId: session.sub },
      },
      image: true,
      autoCollect: true,
      creator: true,
      _count: {
        select: {
          consumers: {
            where: { userId: session.sub },
          },
        },
      },
    },
    where: {
      consumers: {
        some: {
          userId: session.sub,
          hidden: false,
        },
        none: {
          userId: session.sub,
          hidden: true,
        },
      },
    },
  });

  const locations: ConsumedLocation[] = dbLocations.map((location) => {
    return {
      id: location.id,
      lat: location.latitude,
      lng: location.longitude,
      title: location.title,
      description: location.description ?? "No description provided",
      viewed: location.consumers.some((el) => el.viewedAt != null),
      auto_collect: location.autoCollect,
      brand_image_url: location.creator.profileUrl ?? avaterIconUrl,
      brand_id: location.creator.id,
      modal_url: "https://vong.cong/",
      collected: true,
      collection_limit_remaining: location.limit - location._count.consumers,
      brand_name: location.creator.name,
      image_url: location.image ?? location.creator.profileUrl ?? WadzzoIconURL,
      url: location.link ?? "https://app.wadzzo.com/",
    };
  });

  /*

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
  */

  res.status(200).json({ locations: locations });
}
