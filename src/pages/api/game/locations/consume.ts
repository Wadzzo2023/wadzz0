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
      locationGroup: true,
    },
    where: { id: loc.location_id },
  });

  if (!location?.locationGroup) {
    return res.status(422).json({
      success: false,
      data: "Could not find the location",
    });
  }

  if (location.locationGroup.multiPin) {
    // user have not consumed this location
    if (
      location._count.consumers <= 0 &&
      location.locationGroup.remaining > 0
    ) {
      // also check limit of the group

      await db.locationConsumer.create({
        data: { locationId: location.id, userId: pubkey },
      });
      await db.locationGroup.update({
        where: { id: location.locationGroup.id },
        data: { remaining: { decrement: 1 } },
      });

      return res.status(200).json({ success: true, data: "Location consumed" });
    } else {
      return res.status(422).json({
        success: false,
        data: "Location limit reached",
      });
    }
  } else {
    const hasConsumer = await db.locationGroup.findFirst({
      where: {
        locations: {
          some: {
            consumers: {
              some: {
                userId: pubkey,
              },
            },
          },
        },
        id: location.locationGroup.id,
      },
    });

    if (!hasConsumer) {
      await db.locationConsumer.create({
        data: { locationId: location.id, userId: pubkey },
      });

      await db.locationGroup.update({
        where: { id: location.locationGroup.id },
        data: { remaining: { decrement: 1 } },
      });

      return res.status(200).json({ success: true, data: "Location consumed" });
    } else {
      return res.status(422).json({
        success: false,
        data: "Location limit reached",
      });
    }
  }
}
