import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { follow_creator } from "~/lib/stellar/fan/follow_creator";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);
  const token = await getToken({ req });
  // console.log(token, "..");

  // Check if the user is authenticated
  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const data = z.object({ brand_id: z.string() }).parse(req.body);

  const userId = token.sub;
  const userEmail = token.email;
  if (!userId || !userEmail) {
    res.status(404).json({
      error: "userID/email not found",
    });
    return;
  }
  const creator = await db.creator.findUniqueOrThrow({
    where: { id: data.brand_id },
    select: {
      pageAsset: true,
      customPageAssetCodeIssuer: true,
    },
  });
  if (!creator) {
    res.status(404).json({
      error: "creator not found",
    });
    return;
  }
  if (creator.pageAsset) {
    const { code, issuer } = creator.pageAsset;

    const xdr = await follow_creator({
      creatorPageAsset: { code, issuer },
      userPubkey: userId,
      signWith: { email: userEmail },
    });

    res.status(200).json({ xdr });
  } else {
    if (creator.customPageAssetCodeIssuer) {
      const [code, issuer] = creator.customPageAssetCodeIssuer.split("-");
      const issuerVal = z.string().length(56).safeParse(issuer);
      if (issuerVal.success && code) {
        const xdr = await follow_creator({
          creatorPageAsset: { code, issuer: issuerVal.data },
          userPubkey: userId,
          signWith: { email: userEmail },
        });
        // console.log(xdr);
        res.status(200).json({ xdr });
      } else {
        res.status(404).json({
          error: "creator has no page asset",
        });
      }
    }
    res.status(404).json({
      error: "creator has no page asset",
    });
  }
}
