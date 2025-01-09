import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { env } from "process";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";
import crypto from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "~/server/s3";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    await EnableCors(req, res);
    const token = await getToken({ req });

    // Check if the user is authenticated
    if (!token) {
        return res.status(401).json({
            error: "User is not authenticated",
        });
    }

    const pubkey = token.sub;

    if (!pubkey) {
        return res.status(404).json({
            error: "pubkey not found",
        });
    }

    const data = z.object({
        contentType: z.string(),
        fileName: z.string(),
    }).safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({
            error: data.error,
        });
    }

    const file = data.data;

    const genFileName = generateFileName(32, file.fileName);

    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.NEXT_AWS_BUCKET_NAME,
        Key: genFileName,
        ContentType: file.contentType,

    });
    console.log(putObjectCommand);
    const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
        expiresIn: 3600,
    });

    res.status(200).json({
        uploadUrl,
        fileUrl: getAwsS3PublicUrl(genFileName)
    })
}
const generateFileName = (bytes = 32, fileName: string) => {
    return `${crypto.randomBytes(bytes).toString("hex")}-${fileName}`;
}

function getAwsS3PublicUrl(key: string) {
    return `https://${process.env.NEXT_AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
