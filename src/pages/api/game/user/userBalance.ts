// PlatformAssetBalance

import type { NextApiRequest, NextApiResponse } from "next";

import { getSession } from "next-auth/react";
import { PlatformAssetBalance } from "~/lib/stellar/walletBalance/acc";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const session = await getSession({ req });
    if (!session) {
        res.status(401).json({
            error: "User is not authenticated",
        });
        return;
    }

    const userId = session.user.id;
    const balance = await PlatformAssetBalance({
        userPubKey: userId,
    });





    return res.status(200).json(balance);

}