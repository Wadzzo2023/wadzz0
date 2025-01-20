// nextjs 14 api routes

import { Asset } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await NextCors(req, res, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });

  let Fulltomlstring = defaultTomlString;

  const assets = await db.asset.findMany({
    select: {
      issuer: true,
      code: true,
      name: true,
      description: true,
      thumbnail: true,
      limit: true,
    },
  });

  for (const asset of assets) {
    Fulltomlstring += dictinaryToTomlString(asset as Asset);
  }

  res.send(Fulltomlstring);
  return;

  // res.status(200).json({ message: assets });
}

export function dictinaryToTomlString(dict: Asset) {
  const ipfsHash = dict.thumbnail.split("/").pop();
  let tomlString = "[[CURRENCIES]]\n";
  tomlString += `code="${dict.code}"\n`;
  tomlString += `issuer="${dict.issuer}"\n`;
  tomlString += `display_decimals=7\n`;
  tomlString += `name="${dict.name}"\n`;
  tomlString += `desc="${dict.description}"\n`;
  tomlString += `image="${dict.thumbnail}"\n`;
  if (dict.limit) tomlString += `limit=${dict.limit}\n`;

  return tomlString + "\n";
}

const defaultTomlString = `[DOCUMENTATION]
ORG_NAME="Wadzzo"
ORG_URL="https://wadzzo.com/"
ORG_LOGO="https://raw.githubusercontent.com/Bandcoin2023/assets/refs/heads/main/public/wadzzo.webp"
ORG_DESCRIPTION="Wadzzo: Explore, Collect, Win"
ORG_TWITTER="WadzzoApp"
ORG_OFFICIAL_EMAIL="support@wadzzo.com"

[[PRINCIPALS]]
name="Arnob Dey"
twitter="ArnobDey_Dev"
github="arnob016"

`;
