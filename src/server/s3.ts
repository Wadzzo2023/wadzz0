import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { env } from "~/env";

const s3Client = new S3Client({
  region: env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
});

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
];

export const endPoints = [
  "imageUploader",
  "videoUploader",
  "musicUploader",
] as const;
export type EndPointType = (typeof endPoints)[number];

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

function getAwsS3PublicUrl(key: string) {
  return `https://${env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

const uploaderType: Record<
  EndPointType,
  { maxFileSize: string; maxFileCount: number; expireIn: number }
> = {
  imageUploader: {
    maxFileSize: "4MB",
    maxFileCount: 1,
    expireIn: 60 /* 1 minute*/,
  },
  videoUploader: { maxFileSize: "256MB", maxFileCount: 1, expireIn: 60 * 10 },
  musicUploader: { maxFileSize: "64MB", maxFileCount: 1, expireIn: 60 * 5 },
};

type GetSignedURLParams = {
  fileType: string;
  fileSize: number;
  checksum: string;
  endPoint: EndPointType;
};

export async function getSignedURL({
  checksum,
  fileSize,
  fileType,
  endPoint,
}: GetSignedURLParams) {
  const expireIn = uploaderType[endPoint].expireIn;
  if (fileSize > convertSize(uploaderType[endPoint].maxFileSize)) {
    throw new Error("File is too large");
  }

  if (!allowedFileTypes.includes(fileType)) {
    throw new Error("File type not allowed");
  }

  const fileName = generateFileName();
  const putObjectCommand = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
    ContentLength: fileSize,
    ChecksumSHA256: checksum,
  });

  const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: expireIn,
  });
  return { uploadUrl, fileUrl: getAwsS3PublicUrl(fileName) };
}

function convertSize(value: string) {
  const maxFileSizeInMB = parseInt(value.replace(/\D/g, ""));
  const maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;
  return maxFileSizeInBytes;
}
