import "server-only";

import crypto from "crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "~/env";
import { ENTRY_FILE_TYPES, IMAGE_FILE_TYPES, MAX_ENTRY_FILE_BYTES, MAX_IMAGE_BYTES } from "~/lib/upload-files";

export { MAX_ENTRY_FILE_BYTES, MAX_ENTRY_FILES } from "~/lib/upload-files";

/**
 * Presigned PUTs into the shared bucket (the same one brand-wadzzo and
 * wadzzoAR use). The browser uploads straight to S3; the server only signs,
 * and the SHA-256 checksum in the signature pins the URL to the declared file.
 */
export const s3Client = new S3Client({
  region: env.AWS_BUCKET_REGION,
  credentials: { accessKeyId: env.AWS_ACCESS_KEY, secretAccessKey: env.AWS_SECRET_ACCESS_KEY },
});

const EXPIRES_IN_SECONDS = 60 * 10;

export function publicS3Url(key: string) {
  return `https://${env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

/** True for a URL this bucket serves — used to reject foreign links. */
export function isOwnS3Url(url: string) {
  return url.startsWith(publicS3Url(""));
}

async function sign({ fileType, fileSize, checksum, fileName }: { fileType: string; fileSize: number; checksum: string; fileName: string }) {
  const key = crypto.randomBytes(32).toString("hex");
  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key: key, ContentType: fileType, ContentLength: fileSize, ChecksumSHA256: checksum }),
    { expiresIn: EXPIRES_IN_SECONDS },
  );
  return { uploadUrl, fileUrl: publicS3Url(key), fileName };
}

/** A bounty entry attachment. */
export async function signEntryUpload(file: { fileType: string; fileSize: number; checksum: string; fileName: string }) {
  if (file.fileSize > MAX_ENTRY_FILE_BYTES) throw new Error("File is too large");
  if (!(ENTRY_FILE_TYPES as readonly string[]).includes(file.fileType)) throw new Error("That file type can't be attached");
  return sign(file);
}

/** A profile picture or cover image. */
export async function signImageUpload(file: { fileType: string; fileSize: number; checksum: string; fileName: string }) {
  if (file.fileSize > MAX_IMAGE_BYTES) throw new Error("Image is too large (max 10 MB)");
  if (!(IMAGE_FILE_TYPES as readonly string[]).includes(file.fileType)) throw new Error("Use a JPG, PNG, WebP or GIF image");
  return sign(file);
}
