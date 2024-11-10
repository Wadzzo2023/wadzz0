import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import NextCors from "nextjs-cors";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);


  const token = await getToken({ req });
  // console.log(token, "..");

  // Check if the user is authenticated
  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const data = z.object({ brand_id: z.string() }).parse(req.body);

  const creator = await db.creator.findUniqueOrThrow({
    where: { id: data.brand_id },
  });

  const pubkey = token.sub;

  if (!pubkey) {
    res.status(404).json({
      error: "pubkey not found",
    });
    return;
  }

  const follow = await db.follow.create({
    data: { creatorId: creator.id, userId: pubkey },
  });

  await db.notification.create({
    data: {
      notifierId: pubkey,
      isCreator: true,
      notificationObject: {
        create: {
          entityType: "FOLLOW",
          entityId: follow.id,
          actor: {
            connect: { id: pubkey },
          },
        },
      },
    },
  });

  res.status(200).json(follow);
}
