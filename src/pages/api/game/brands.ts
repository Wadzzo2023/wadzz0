import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import internal from "stream";
import { db } from "~/server/db";
import { Brand } from "~/types/game/brand";

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

  const follows = await db.follow.findMany({
    where: { userId: session.user.id },
  });

  const bands: Brand[] = brands.map((brand) => {
    return {
      id: brand.id,
      first_name: brand.name,
      last_name: "",
      email: "",
      logo: brand.pageAsset?.thumbnail ?? brand.profileUrl ?? avaterIconUrl,
      followed_by_current_user: follows.some(
        (follow) => follow.creatorId === brand.id,
      ),
    };
  });

  res.status(200).json({ users: bands });
}

export const avaterIconUrl =
  "https://app.wadzzo.com/images/icons/avatar-icon.png";
