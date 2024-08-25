import type { NextApiRequest, NextApiResponse } from "next";

import { getSession } from "next-auth/react";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const session = await getSession({ req });

    if (session) {
      const user = session.user;

      // delete all user data.
      const response = await db.locationConsumer.deleteMany({
        where: { userId: user.id },
      });

      return res.status(204).end();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
}
