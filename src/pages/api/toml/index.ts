// nextjs 14 api routes

import { Asset } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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
  tomlString += `image="${ipfsHash}"\n`;
  if (dict.limit) tomlString += `limit="${dict.limit}"\n`;

  return tomlString + "\n";
}

const defaultTomlString = `[DOCUMENTATION]
ORG_URL="<${env.NEXT_PUBLIC_URL}>"

[[CURRENCIES]]
issuer="get asset issuer"
code="get asset code"
name="get asset name"
desc="This is a description of the cool NFT."
image="ipfs link ending with file format extension"
limit=limit
display_decimals=7

`;
