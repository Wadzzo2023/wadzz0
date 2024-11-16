
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

import { createTransport, Transporter } from "nodemailer";

import { EnableCors } from "~/server/api-cors";


const transporter: Transporter = createTransport({
    service: "Gmail",
    auth: {
        user: process.env.NEXT_PUBLIC_NODEMAILER_USER,
        pass: process.env.NEXT_PUBLIC_NODEMAILER_PASS,
    },
});

const sendEmail = async (userEmail: string | null | undefined, userId: string): Promise<void> => {
    try {
        const mailOptions = {
            from: userEmail ?? "sheikhfoysal2025@gmail.com",
            to: process.env.NEXT_PUBLIC_NODEMAILER_USER,
            subject: "User Data Deletion Request",
            text: `The following user has requested to delete their data:\n\nUser ID: ${userId}\nUser Email: ${userEmail}`,
        };


        const result = transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", result);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Failed to send email");
    }
};

export default async function handler(req: NextApiRequest,
    res: NextApiResponse,) {
    await EnableCors(req, res);
    const token = await getToken({ req });

    if (!token?.sub) {
        return res.status(401).json({
            error: "User is not authenticated",
        });
    }
    console.log("Token:", token);


    try {

        const cx = await sendEmail(token.email, token.sub);
        console.log("Email sent successfully:", cx);
        res.status(200).json({ message: "Data deleted and email sent" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting data or sending email" });
    }

}
