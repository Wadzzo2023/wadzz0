/**
 * What can be uploaded: bounty entries and profile images.
 *
 * What a bounty entry can carry. Shared by the server's upload signer
 * (`server/s3.ts`) and the entry sheet, so a file the server would refuse
 * is caught before it's hashed and uploaded.
 *
 * Same limits as wadzz0's `multiBlobUploader`. The types are a subset of
 * its list — its 3D-model and spreadsheet types are creator tooling, not
 * something a fan submits from a camera roll.
 */
export const MAX_ENTRY_FILES = 5;
export const MAX_ENTRY_FILE_BYTES = 1024 * 1024 * 1024;

export const ENTRY_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "application/pdf",
  "text/plain",
] as const;

export function entryFileProblem(file: File): string | null {
  if (!(ENTRY_FILE_TYPES as readonly string[]).includes(file.type)) {
    return "This file type can't be attached";
  }
  if (file.size > MAX_ENTRY_FILE_BYTES) return "Over the 1 GB limit";
  return null;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function imageFileProblem(file: File): string | null {
  if (!(IMAGE_FILE_TYPES as readonly string[]).includes(file.type)) return "Use a JPG, PNG, WebP or GIF image";
  if (file.size > MAX_IMAGE_BYTES) return "Over the 10 MB limit";
  return null;
}
