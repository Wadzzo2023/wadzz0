import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";

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
        name: z.string().min(2).max(100),
        bio: z.string().max(200).optional(),
        pronouns: z.string().max(50).optional(),
    }).safeParse(req.body);
    if (!data.success) {
        return res.status(400).json({
            error: data.error,
        });
    }
    const userData = data.data;
    try {
        await db.user.update({
            where: { id: pubkey },
            data: {
                name: userData.name,
                bio: userData.bio,
                pronouns: userData.pronouns,
            },
        });
        res.status(200).json({ message: "Profile updated successfully" });
    }
    catch (e) {
        res.status(400).json({ error: "Failed to save profile. Please try again." });
    }

}
