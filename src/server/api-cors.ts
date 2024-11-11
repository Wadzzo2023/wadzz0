import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

export async function EnableCors(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "https://main.d20qrrwbkiopzh.amplifyapp.com",

    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
}
