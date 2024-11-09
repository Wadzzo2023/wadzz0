import type { NextApiRequest, NextApiResponse } from "next";

import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";
import { Location } from "~/types/game/location";
import { avaterIconUrl as abaterIconUrl } from "../brands";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);
  const token = await getToken({ req });

  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }
  const data = z.object({ filterId: z.string() }).safeParse(req.query); // Use req.query instead of req.body

  if (!data.success) {
    console.log("data.error", data.error);
    return res.status(400).json({
      error: data.error,
    });
  }
  const userId = token.sub;
  if (data.data.filterId === "1") {
    const getAllFollowedBrand = await db.creator.findMany({
      where: {
        followers: {
          some: {
            userId: userId,
          },
        },
      },
    });
    // now i am extracting this brands pins
    const pins = await db.location.findMany({
      where: {
        creatorId: {
          in: getAllFollowedBrand.map((el) => el.id),
        },
        approved: { equals: true },
        endDate: { gte: new Date() },
        tier: { is: null },
      },
      select: {
        id: true,
        link: true,
        latitude: true,
        longitude: true,
        description: true,
        creatorId: true,
        title: true,
        limit: true,
        _count: {
          select: {
            consumers: {
              where: { userId: userId },
            },
          },
        },
        image: true,
        autoCollect: true,
        creator: true,
      },
    });
    console.log("pins", pins.length);

    const locations: Location[] = pins.map((location) => {
      return {
        id: location.id,
        lat: location.latitude,
        lng: location.longitude,
        title: location.title,
        description: location.description ?? "No description provided",
        brand_name: location.creator.name,
        url: location.link ?? "https://wadzzo.com/",
        image_url:
          location.image ?? location.creator.profileUrl ?? WadzzoIconURL,
        collected: location._count.consumers >= location.limit,
        collection_limit_remaining: location.limit - location._count.consumers,
        auto_collect: location.autoCollect,
        brand_image_url: location.creator.profileUrl ?? abaterIconUrl,
        brand_id: location.creatorId,
        public: true,
      };
    });
    console.log("locations", locations.length);

    res.status(200).json({ locations });
  } else {
    const all_creator_public_pin = await db.location.findMany({
      select: {
        id: true,
        link: true,
        latitude: true,
        longitude: true,
        description: true,
        creatorId: true,
        title: true,
        limit: true,
        _count: {
          select: {
            consumers: {
              where: { userId: userId },
            },
          },
        },
        image: true,
        autoCollect: true,
        creator: true,
      },
      where: {
        approved: { equals: true },
        endDate: { gte: new Date() },
        tier: { is: null },
      },
    });
    const locations: Location[] = all_creator_public_pin.map((location) => {
      return {
        id: location.id,
        lat: location.latitude,
        lng: location.longitude,
        title: location.title,
        description: location.description ?? "No description provided",
        brand_name: location.creator.name,
        url: location.link ?? "https://wadzzo.com/",
        image_url:
          location.image ?? location.creator.profileUrl ?? WadzzoIconURL,
        collected: location._count.consumers >= location.limit,
        collection_limit_remaining: location.limit - location._count.consumers,
        auto_collect: location.autoCollect,
        brand_image_url: location.creator.profileUrl ?? abaterIconUrl,
        brand_id: location.creatorId,
        public: true,
      };
    });
    console.log("locations", locations.length);

    res.status(200).json({
      locations,
    });
  }
}

export const WadzzoIconURL = "https://app.wadzzo.com/images/loading.png";
