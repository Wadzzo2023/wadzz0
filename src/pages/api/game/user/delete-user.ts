
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

import { createTransport, Transporter } from "nodemailer";
import { initAdmin } from "package/connect_wallet/src/lib/firebase/admin/config";

import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";


// const transporter: Transporter = createTransport({
//     service: "Gmail",
//     auth: {
//         user: process.env.NEXT_PUBLIC_NODEMAILER_USER,
//         pass: process.env.NEXT_PUBLIC_NODEMAILER_PASS,
//     },
// });

// const sendEmail = async (userEmail: string | null | undefined, userId: string): Promise<void> => {
//     try {
//         const mailOptions = {
//             from: userEmail ?? "sheikhfoysal2025@gmail.com",
//             to: process.env.NEXT_PUBLIC_NODEMAILER_USER,
//             subject: "User Data Deletion Request",
//             text: `The following user has requested to delete their data:\n\nUser ID: ${userId}\nUser Email: ${userEmail}`,
//         };


//         const result = transporter.sendMail(mailOptions);
//         console.log("Email sent successfully:", result);
//     } catch (error) {
//         console.error("Error sending email: ", error);
//         throw new Error("Failed to send email");
//     }
// };

export default async function handler(req: NextApiRequest,
    res: NextApiResponse,) {
    await EnableCors(req, res);
    const token = await getToken({ req });

    if (!token?.sub) {
        return res.status(401).json({
            error: "User is not authenticated",
        });
    }
    if (token.email) {
        const admin = initAdmin();
        const userRecord = await admin.auth().getUserByEmail(token.email);
        const deleteUser = await admin.auth().deleteUser(userRecord.uid);
    }
    try {
        const user = await db.user.findUnique({
            where: {
                id: token.sub,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await db.user.delete({
            where: {
                id: token.sub,
            },
            include: {
                sessions: true,
                accounts: true,
                actorNotificationObjects: true,
                Admin: true,
                assets: true,
                Bounty: true,
                BountyComment: true,
                BountyDoubt: true,
                BountyDoubtMessage: true,
                BountyParticipant: true,
                BountySubmission: true,
                BountyWinner: true,
                comments: true,
                likes: true,
                followings: true,
                LocationConsumer: true,
                RedeemConsumer: true,
                songs: true,
                creator: true,
            }
        })


        res.status(200).json({ message: "User data is deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting data or sending email" });
    }

}
