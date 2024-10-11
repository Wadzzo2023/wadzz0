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
      // console.log(session.user);
      const user = await db.user.findFirst({
        where: {
          id: session.user.id,
        },
      });
      if (user) {
        return res.status(200).json({ energy: user.energy });
      } else {
        return res.status(404).json({ error: "User not found" });
      }
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
