// PlatformAssetBalance

import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

import { PlatformAssetBalance } from "~/lib/stellar/walletBalance/acc";
import { EnableCors } from "~/server/api-cors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  await EnableCors(req, res);
  const token = await getToken({ req });
  if (!token?.sub) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const userId = token.sub;

  const balance = await PlatformAssetBalance({
    userPubKey: userId,
  });

  return res.status(200).json(balance);
}
