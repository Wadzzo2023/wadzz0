import type { NextApiRequest, NextApiResponse } from "next";

import { getSession } from "next-auth/react";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);
  try {
    const session = await getSession({ req });
    console.log(session);
    if (session) {
      const user = await db.user.findUnique({
        where: {
          id: session.user.id,
        },
      });
      return res.status(200).json(user);
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
}
