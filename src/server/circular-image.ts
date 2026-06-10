import sharp from "sharp";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3";
import { env } from "~/env";

const OUTPUT_SIZE = 600;

function getAwsS3PublicUrl(key: string) {
  return `https://${env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

export async function createCircularImage(
  sourceUrl: string,
): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${sourceUrl}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const circleMask = Buffer.from(
    `<svg width="${OUTPUT_SIZE}" height="${OUTPUT_SIZE}">
      <circle cx="${OUTPUT_SIZE / 2}" cy="${OUTPUT_SIZE / 2}" r="${OUTPUT_SIZE / 2}" fill="white"/>
    </svg>`,
  );

  const circularBuffer = await sharp(buffer)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover", position: "center" })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .ensureAlpha()
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const fileName = `circular-${crypto.randomBytes(32).toString("hex")}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: circularBuffer,
      ContentType: "image/png",
    }),
  );

  return getAwsS3PublicUrl(fileName);
}
