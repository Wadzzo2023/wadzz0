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

  const userId = session.sub;

  // Return the locations

  // const consumedLocations = await db.locationConsumer.findMany({
  //   where: {
  //     userId: userId,
  //     hidden: false,
  //   },
  //   include: {
  //     location: {
  //       include: {
  //         locationGroup: { include: { creator: true } },
  //       },
  //     },
  //   },
  // });

  // location
  const dbLocations = await db.location.findMany({
    include: {
      locationGroup: {
        include: {
          creator: true,
          locations: {
            include: {
              _count: {
                select: {
                  consumers: {
                    where: { userId: session.sub },
                  },
                },
              },
            },
          },
        },
      },
      consumers: {
        select: {
          userId: true,
          viewedAt: true,
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

  const locations = dbLocations.map((location) => {
    if (!location.locationGroup) return;

    const totalGroupConsumers = location.locationGroup.locations.reduce(
      (sum, location) => sum + location._count.consumers,
      0,
    );

    const remaining = location.locationGroup.limit - totalGroupConsumers;

    const loc: ConsumedLocation = {
      id: location.id,
      lat: location.latitude,
      lng: location.longitude,
      title: location.locationGroup.title,
      description:
        location.locationGroup?.description ?? "No description provided",
      viewed: location.consumers.some((el) => el.viewedAt != null),
      auto_collect: location.autoCollect,
      brand_image_url:
        location.locationGroup?.creator.profileUrl ?? avaterIconUrl,
      brand_id: location.locationGroup?.creator.id,
      modal_url: "https://vong.cong/",
      collected: true,
      collection_limit_remaining: remaining,
      brand_name: location.locationGroup.creator.name,
      image_url:
        location.locationGroup.image ??
        location.locationGroup.creator.profileUrl ??
        WadzzoIconURL,
      url: location.locationGroup.link ?? "https://app.wadzzo.com/",
    };
    return loc;
  });

  // const locations: ConsumedLocation[] = dbLocations.map((location) => {
  //   return {
  //     id: location.id,
  //     lat: location.latitude,
  //     lng: location.longitude,
  //     title: location.title,
  //     description: location.description ?? "No description provided",
  //     viewed: location.consumers.some((el) => el.viewedAt != null),
  //     auto_collect: location.autoCollect,
  //     brand_image_url: location.creator.profileUrl ?? avaterIconUrl,
  //     brand_id: location.creator.id,
  //     modal_url: "https://vong.cong/",
  //     collected: true,
  //     collection_limit_remaining: location.limit - location._count.consumers,
  //     brand_name: location.creator.name,
  //     image_url: location.image ?? location.creator.profileUrl ?? WadzzoIconURL,
  //     url: location.link ?? "https://app.wadzzo.com/",
  //   };
  // });

  res.status(200).json({ locations: locations });
}
