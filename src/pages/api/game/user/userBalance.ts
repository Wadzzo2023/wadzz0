// PlatformAssetBalance

import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

import { StellarAccount } from "~/lib/stellar/account";
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

  // Same contract as before: the balance string, 0 without a trustline, -1 for an inactive account.
  const acc = await StellarAccount.load(userId);
  const balance = !acc ? -1 : acc.trustsPlatformAsset() ? String(acc.platformBalance()) : 0;

  return res.status(200).json(balance);
}
