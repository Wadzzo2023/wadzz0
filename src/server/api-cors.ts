import { NextApiRequest, NextApiResponse } from "next";
import { headers } from "next/headers";
import NextCors from "nextjs-cors";

export async function EnableCors(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "http://localhost:8081",
    headers: ["Access-Control-Allow-Credentials"],

    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
}
