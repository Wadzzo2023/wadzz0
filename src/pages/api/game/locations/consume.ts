import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { db } from "~/server/db";
import NextCors from "nextjs-cors";
// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,


) {

  await NextCors(req, res, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  const token = await getToken({ req });

  // Check if the user is authenticated
  if (!token) {
    return res.status(401).json({
      error: "User is not authenticated",
    });
  }

  const pubkey = token.sub;

  if (!pubkey) {
    return res.status(404).json({
      error: "pubkey not found",
    });
  }

  const data = z
    .object({ location_id: z.string().transform(Number) })
    .safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({
      error: data.error,
    });
  }
  const loc = data.data;

  const location = await db.location.findUnique({
    include: {
      _count: {
        select: {
          consumers: {
            where: { userId: pubkey },
          },
        },
      },
    },
    where: { id: loc.location_id },
  });

  if (!location) {
    return res.status(422).json({
      success: false,
      data: "Could not find the location",
    });
  }

  if (location._count.consumers < location.limit) {
    await db.locationConsumer.create({
      data: { locationId: location.id, userId: pubkey },
    });
    return res.status(200).json({ success: true, data: "Location consumed" });
  } else {
    return res.status(422).json({
      success: false,
      data: "Location limit reached",
    });
  }
}
