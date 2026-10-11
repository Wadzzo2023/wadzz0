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

  // Check if the user is authenticated
  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const data = z.object({ location_id: z.string() }).safeParse(req.body);
  if (!data.success) {
    res.status(400).json({
      error: data.error,
    });
    return;
  }
  const location = data.data;

  if (!token.sub) {
    res.status(404).json({
      error: "pubkey not found",
    });
    return;
  }

  const consumedLocation = await db.locationConsumer.findFirst({
    where: { locationId: location.location_id, userId: token.sub },
  });

  if (consumedLocation) {
    // mark as view
    await db.locationConsumer.update({
      where: { id: consumedLocation.id },
      data: { viewedAt: new Date() },
    });
    res.status(200).json({
      success: true,
      data: "Billboard marked as viewed",
    });
    return;
  } else {
    res.status(422).json({
      success: false,
      data: "Could not find billboard",
    });
    return;
  }
}
