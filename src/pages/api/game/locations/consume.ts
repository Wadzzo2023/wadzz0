import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);
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

  const data = z.object({ location_id: z.string() }).safeParse(req.body);

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
      locationGroup: {
        include: {
          locations: {
            include: {
              _count: {
                select: {
                  consumers: {
                    where: { userId: pubkey },
                  },
                },
              },
            },
          },
        },
      },
    },
    where: { id: loc.location_id },
  });

  if (!location?.locationGroup) {
    return res.status(422).json({
      success: false,
      data: "Could not find the location",
    });
  }

  const totalGroupConsumers = location.locationGroup.locations.reduce(
    (sum, location) => sum + location._count.consumers,
    0,
  );

  const remainingConsumers = location.locationGroup.limit - totalGroupConsumers;

  // user have not consumed this location
  if (location._count.consumers < 0 && remainingConsumers > 0) {
    // also check limit of the group
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
