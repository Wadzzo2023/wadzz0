import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { getSession } from "next-auth/react";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { z } from "zod";
import { follow_brand } from "~/lib/stellar/game/follow";
import { db } from "~/server/db";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  // Check if the user is authenticated
  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const data = z.object({ brand_id: z.string() }).parse(req.body);
  console.log(data);

  const creator = await db.creator.findUniqueOrThrow({
    where: { id: data.brand_id },
    include: { pageAsset: true },
  });
  const asset = creator.pageAsset;

  if (!asset) throw new Error("Creator has no asset");

  if (!token.email) throw new Error("User has no email");

  const secret = await getAccSecretFromRubyApi(token.email);

  const xdr = await follow_brand({
    creatorPageAsset: { code: asset.code, issuer: asset.issuer },
    userSecret: secret,
  });

  res.status(200).json(xdr);
}
