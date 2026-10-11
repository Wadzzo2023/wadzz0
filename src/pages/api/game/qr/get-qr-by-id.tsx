import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {

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

    const data = z.object({ qrId: z.string() }).safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({
            error: data.error,
        });
    }
    const qrData = data.data;

    const qrItem = await db.qRItem.findUnique({
        where: { id: qrData.qrId },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            descriptions: true,
        },
    });

    if (!qrItem) {
        return res.status(404).json({
            error: "QR item not found",
        });
    }
    console.log("QR Item found:", qrItem);
    return res.status(200).json({
        id: qrItem.id,
        title: qrItem.title,
        descriptions: qrItem.descriptions,
        modelUrl: qrItem.modelUrl,
        externalLink: qrItem.externalLink,
        startDate: qrItem.startDate,
        endDate: qrItem.endDate,
        isActive: new Date() >= qrItem.startDate && new Date() <= qrItem.endDate,
        creator: {
            id: qrItem.creator.id,
            name: qrItem.creator.name,
            image: qrItem.creator.image,
        },
    });
}
