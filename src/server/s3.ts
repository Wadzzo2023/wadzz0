import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { env } from "~/env";

export const s3Client = new S3Client({
  region: env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // video
  "video/mp4",
  "video/quicktime",

  // audio
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/alac",
  "audio/aiff",
  "audio/wma",
  "audio/m4a",
  "audio/x-wav",
  "audio/x-ms-wma",
  "audio/x-aiff",
  "audio/x-flac",
  "audio/x-m4a",
  "audio/x-mp3",
  "audio/x-mpeg",
  "audio/x-ogg",
  "audio/x-aac",
  "audio/x-alac",
  "audio/x-wav",
  "audio/x-ms-wma",
  "audio/x-aiff",
  "video/webm",
  // model
  "application/octet-stream", // General binary files
  ".obj", // Explicitly allow `.obj` extensions

  // other
  "application/vnd.google-apps.document", // Google Docs
  "application/vnd.google-apps.spreadsheet", // Google Sheets
  "text/plain", // Plain text
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  "application/vnd.ms-excel", // XLS (old Excel format)
  "text/csv", // CSV
  "text/tab-separated-values", // TSV
  "application/pdf", // PDF
  "application/vnd.oasis.opendocument.spreadsheet",
];

export const endPoints = [
  "imageUploader",
  "videoUploader",
  "musicUploader",
  "blobUploader",
  "multiBlobUploader",
  "modelUploader",
  "svgUploader",
  "coverUploader",
  "profileUploader",
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
    maxFileSize: "1024MB",
    maxFileCount: 1,
    expireIn: 60 * 10 /* 1 minute*/,
  },
  videoUploader: { maxFileSize: "1024MB", maxFileCount: 1, expireIn: 60 * 10 },
  musicUploader: { maxFileSize: "1024MB", maxFileCount: 1, expireIn: 60 * 10 },
  blobUploader: {
    maxFileSize: "1024MB",
    maxFileCount: 1,
    expireIn: 60 * 10,
  },

  multiBlobUploader: {
    maxFileSize: "1024MB",
    maxFileCount: 5,
    expireIn: 60 * 10,
  },
  modelUploader: {
    maxFileSize: "1024MB",
    maxFileCount: 1,
    expireIn: 60 * 10,
  },
  svgUploader: { maxFileSize: "1024MB", maxFileCount: 1, expireIn: 60 * 10 },
  coverUploader: { maxFileSize: "1024MB", maxFileCount: 1, expireIn: 60 * 10 },
  profileUploader: {
    maxFileSize: "1024MB",
    maxFileCount: 1,
    expireIn: 60 * 10,
  },
};

type GetSignedURLParams = {
  fileType: string;
  fileSize: number;
  checksum: string;
  endPoint: EndPointType;
  fileName: string;
};

export async function getSignedURL({
  checksum,
  fileSize,
  fileType,
  endPoint,
  fileName,
}: GetSignedURLParams) {
  const expireIn = uploaderType[endPoint].expireIn;

  console.log("fileType", fileType);
  if (fileSize > convertSize(uploaderType[endPoint].maxFileSize)) {
    throw new Error("File is too large");
  }

  if (!allowedFileTypes.includes(fileType)) {
    throw new Error("File type not allowed");
  }

  const genFileName = generateFileName();
  const putObjectCommand = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: genFileName,
    ContentType: fileType,
    ContentLength: fileSize,
    ChecksumSHA256: checksum,
  });

  const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: expireIn,
  });
  return {
    uploadUrl,
    fileUrl: getAwsS3PublicUrl(genFileName),
    fileName: fileName,
  };
}

function convertSize(value: string) {
  const maxFileSizeInMB = parseInt(value.replace(/\D/g, ""));
  const maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;
  return maxFileSizeInBytes;
}
