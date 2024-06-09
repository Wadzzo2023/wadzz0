import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { db } from "~/server/db";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  // Check if the user is authenticated
  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const data = z
    .object({ location_id: z.string().transform(Number) })
    .safeParse(req.body);

  if (!data.success) {
    res.status(400).json({
      error: data.error,
    });
    return;
  }
  const loc = data.data;

  const location = await db.location.findUnique({
    where: { id: loc.location_id },
  });
  if (!location) {
    res.status(422).json({
      success: false,
      data: "Could not find the location",
    });
    return;
  }

  const pubkey = token.sub;

  if (!pubkey) {
    res.status(404).json({
      error: "pubkey not found",
    });
    return;
  }
  await db.locationConsumer.create({
    data: { locationId: location.id, userId: pubkey },
  });

  res.status(200).json({ success: true, data: "Location consumed" });
}
