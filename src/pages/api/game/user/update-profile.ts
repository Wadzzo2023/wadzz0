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

    const data = z.object({ name: z.string(), image: z.string() }).safeParse(req.body);
    if (!data.success) {
        return res.status(400).json({
            error: data.error,
        });
    }
    const userData = data.data;
    try {
        const user = await db.user.update({
            where: { id: pubkey },
            data: {
                name: userData.name,
                image: userData.image,
            },
        });
        res.status(200).json({ messasge: "Profile updated successfully" });
    }
    catch (e) {
        res.status(400).json({ error: "Field to save profile. Please try again." });
    }

}
