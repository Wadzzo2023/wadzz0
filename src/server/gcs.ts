import { Storage } from "@google-cloud/storage";
import { env } from "~/env.js";

const storage = new Storage({ projectId: env.GOOGLE_CLOUD_PROJECT });
const bucket = storage.bucket(env.GCS_MURAL_BUCKET!);

export async function mirrorToGcs(s3Url: string, destPath: string): Promise<string> {
  const response = await fetch(s3Url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from S3: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const file = bucket.file(destPath);
  const contentType = response.headers.get("content-type") || "image/jpeg";

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return `gs://${env.GCS_MURAL_BUCKET}/${destPath}`;
}
