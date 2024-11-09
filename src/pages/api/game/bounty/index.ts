import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Get the current user session
  const token = await getToken({ req });
  if (!token?.sub) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const currentUserId = token.sub;

  const allBounty = await db.bounty.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      imageUrls: true,
      creatorId: true,
      requiredBalance: true,
      priceInBand: true,
      priceInUSD: true,
      winnerId: true,
      status: true,
      _count: {
        select: {
          participants: true,
        },
      },
      creator: {
        select: {
          name: true,
          profileUrl: true,
        },
      },

      participants: {
        where: { userId: currentUserId },
        select: { userId: true },
      },
    },
  });

  console.log(allBounty);
  const bountiesWithJoinStatus = allBounty.map((bounty) => ({
    ...bounty,
    isJoined: bounty.participants.length > 0,
  }));
  console.log(bountiesWithJoinStatus);

  res.status(200).json({ allBounty: bountiesWithJoinStatus });
}
