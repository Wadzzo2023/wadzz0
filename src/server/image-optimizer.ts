import sharp from "sharp";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3";
import { env } from "~/env";

function getAwsS3PublicUrl(key: string) {
    return `https://${env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

export async function createOptimizedImage(sourceUrl: string): Promise<string> {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${sourceUrl}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const optimizedBuffer = await sharp(buffer)
        .resize(600, 600, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();

    const fileName = `optimized-${crypto.randomBytes(32).toString("hex")}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: optimizedBuffer,
            ContentType: "image/jpeg",
        }),
    );

    return getAwsS3PublicUrl(fileName);
}
