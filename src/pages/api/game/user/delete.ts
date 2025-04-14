import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { EnableCors } from "~/server/api-cors";

import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);
  try {
    const token = await getToken({ req });

    if (token) {
      // delete all user data.
      const response = await db.locationConsumer.deleteMany({
        where: { userId: token.sub },
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
