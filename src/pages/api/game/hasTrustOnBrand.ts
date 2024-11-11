import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import NextCors from "nextjs-cors";
import { z } from "zod";
import { follow_creator } from "~/lib/stellar/fan/follow_creator";
import { db } from "~/server/db";
import {

    Horizon,

} from "@stellar/stellar-sdk";
import { STELLAR_URL } from "~/lib/stellar/constant";
import { EnableCors } from "~/server/api-cors";
// import { getSession } from "next-auth/react";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    await EnableCors(req, res);
    const token = await getToken({ req });
    // console.log(token, "..");

    // Check if the user is authenticated
    if (!token) {
        res.status(401).json({
            error: "User is not authenticated",
        });
        return;
    }

    const data = z.object({ brand_id: z.string() }).parse(req.body);

    const userId = token.sub;
    const userEmail = token.email;
    if (!userId || !userEmail) {
        res.status(404).json({
            error: "userID not found",
        });
        return;
    }
    const creator = await db.creator.findUniqueOrThrow({
        where: { id: data.brand_id },
        select: {
            pageAsset: true,
            customPageAssetCodeIssuer: true,
        },
    });
    if (!creator) {
        res.status(404).json({
            error: "creator not found",
        });
        return;
    }
    if (creator.pageAsset) {
        const { code, issuer } = creator.pageAsset;



        const server = new Horizon.Server(STELLAR_URL);

        const userAcc = await server.loadAccount(userId);

        console.log("asset_code", code, "asset_issuer", issuer);
        const hasTrust = userAcc.balances.some((balance) => {
            console.log(balance);
            return (
                (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
                balance.asset_code === code &&
                balance.asset_issuer === issuer
            );
        });

        res.status(200).json({ hasTrust });
    }
    res.status(200).json({ hasTrust: false });


}
