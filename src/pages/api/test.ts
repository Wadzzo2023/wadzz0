import type { NextApiRequest, NextApiResponse } from "next";
// import { Client, Environment } from "square";
import { env } from "~/env";
import { z } from "zod";

import { getSession } from "next-auth/react";

export const maxDuration = 3 * 60 * 1000;

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



    const delay = (time: number) =>
      new Promise((resolve) => setTimeout(resolve, time));

    await delay(2 * 60 * 1000); // Wait for 2 minutes

    res.status(200).json(session);
  } catch (e) {
    // console.log(e);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
}
