import type { NextApiRequest, NextApiResponse } from "next";
import { Client, Environment } from "square";
import { env } from "~/env";
import { z } from "zod";

import { getSession } from "next-auth/react";

// (BigInt.prototype as any).toJSON = function () {
//   return this.toString();
// };

// const { paymentsApi } = new Client({
//   accessToken: "YOUR ACCESS TOKEN HERE",
//   environment: "sandbox" as any,
// });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const session = await getSession({ req });

    if (session) {
      console.log(session.user);
    } else {
      console.log("no session");
    }

    const client = new Client({
      accessToken: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT as Environment,
    });

    const pubkey = z.string().length(56).parse(req.query.pubkey);
    const xdr = "vong";

    res.status(200).json({ xdr });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e });
  }
}
