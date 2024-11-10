import { NotificationType } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { getSession } from "next-auth/react";
import NextCors from "nextjs-cors";

import { z } from "zod";
import { SubmissionMediaInfo } from "~/components/modals/file-upload-modal";

import { db } from "~/server/db";



export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {

    const session = await getToken({ req });

    console.log(session);
    if (!session) {
        res.status(401).json({
            error: "User is not authenticated",
        });
        return;
    }

    const data = z.object({
        bountyId: z.string().transform(Number),
        content: z.string(),
        media: z.array(SubmissionMediaInfo).optional(),
    })
        .safeParse(req.body);

    if (!data.success) {
        res.status(400).json({
            error: data.error,
        });
        return;
    }
    console.log("boyd", req.body);
    console.log("data", data.data);

    const userId = session.sub;
    const input = data.data;

    if (!userId) {
        return res.status(404).json({
            error: "pubkey not found",
        });
    }

    console.log("input", input.content);
    const bounty = await db.bounty.findUnique({
        where: {
            id: input.bountyId,
        },
    });
    if (!bounty) {
        throw new Error("Bounty not found");
    }
    await db.bountySubmission.create({
        data: {
            userId: userId,
            content: input.content,
            bountyId: input.bountyId,
            medias: input.media
                ? {
                    createMany: {
                        data: input.media,
                    },
                }
                : undefined,
        },
    });

    await db.notificationObject.create({
        data: {
            actorId: userId,
            entityType: NotificationType.BOUNTY_SUBMISSION,
            entityId: input.bountyId,
            isUser: true,
            Notification: {
                create: [
                    {
                        notifierId: bounty.creatorId,
                        isCreator: true,
                    },
                ],
            },
        },
    });


    return res.status(200).json({
        success: true,
        data: "Bounty joined successfully",
    });

}