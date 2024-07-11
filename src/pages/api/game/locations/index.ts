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

  const all_creator_public_pin = await db.location.findMany({
    select: {
      id: true,
      latitude: true,
      longitude: true,
      description: true,
      creatorId: true,
      title: true,
      consumers: {
        select: { userId: true },
        where: { userId: session.user.id },
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

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      followings: {
        include: {
          creator: {
            include: {
              Location: {
                include: {
                  consumers: {
                    select: { userId: true },
                    where: { userId: session.user.id },
                  },
                  creator: true,
                },
                where: {
                  approved: { equals: true },
                  endDate: { gte: new Date() },
                  tier: {
                    isNot: null,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const following_pins = user?.followings.map((el) => {
    const pins = el.creator.Location.map((location) => location);
    return pins;
  });

  const allFollowingPins = user?.followings.flatMap(
    (el) => el.creator.Location,
  );

  // let locations: Location[];
  const followingsLocations = allFollowingPins?.map((location) => {
    return {
      id: location.id,
      lat: location.latitude,
      lng: location.longitude,
      title: location.title,
      description: location.description ?? "No description provided",
      brand_name: location.creator.name,
      url: "https://picsum.photos/200/300",
      image_url: location.image ?? "https://picsum.photos/500/500",
      collected: location.consumers.length > 0,
      collection_limit_remaining: 3,
      auto_collect: location.autoCollect,
      brand_image_url:
        location.creator.profileUrl ?? "https://picsum.photos/100/100",
      brand_id: location.creatorId,
      public: false,
    };
  });

  let locations: Location[] = all_creator_public_pin.map((location) => {
    return {
      id: location.id,
      lat: location.latitude,
      lng: location.longitude,
      title: location.title,
      description: location.description ?? "No description provided",
      brand_name: location.creator.name,
      url: "https://picsum.photos/200/300",
      image_url: location.image ?? "https://picsum.photos/500/500",
      collected: location.consumers.length > 0,
      collection_limit_remaining: 3,
      auto_collect: location.autoCollect,
      brand_image_url:
        location.creator.profileUrl ?? "https://picsum.photos/100/100",
      brand_id: location.creatorId,
      public: true,
    };
  });

  if (followingsLocations) {
    locations = [...locations, ...followingsLocations];
  }

  res.status(200).json({ locations: locations });
}
