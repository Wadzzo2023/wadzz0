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
  let creatorsId: string[] | undefined = undefined;
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
    creatorsId = getAllFollowedBrand.map((brand) => brand.id);
  }

  // now i am extracting this brands pins

  async function pinsForCreators(creatorsId?: string[]) {
    const extraFilter = {} as { creatorId?: { in: string[] } };

    if (creatorsId) {
      extraFilter.creatorId = { in: creatorsId };
    }

    const locationGroup = await db.locationGroup.findMany({
      where: {
        ...extraFilter,
        approved: { equals: true },
        endDate: { gte: new Date() },
        subscriptionId: { equals: null },
      },
      include: {
        locations: {
          include: {
            consumers: { select: { userId: true } },
          },
        },
        creator: true,
      },
    });

    const pins = locationGroup.flatMap((group) => {
      const totalGroupConsumers = group.locations.reduce(
        (sum, location) => sum + location.consumers.length,
        0,
      );
      return group.locations.map((location) => ({
        ...location,
        ...group,
        remaining: group.limit - totalGroupConsumers,
        id: location.id,
      }));
    });

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
        collected: location.consumers.includes({ userId: userId ?? "" }),
        collection_limit_remaining: location.remaining,
        auto_collect: location.autoCollect,
        brand_image_url: location.creator.profileUrl ?? abaterIconUrl,
        brand_id: location.creatorId,
        public: true,
      };
    });

    return locations;
  }

  const locations = await pinsForCreators(creatorsId);

  res.status(200).json({ locations });
}

export const WadzzoIconURL = "https://app.wadzzo.com/images/loading.png";
