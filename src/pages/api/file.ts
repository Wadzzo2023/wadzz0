import formidable from "formidable";
import fs from "fs";
const pinataSDK = require("@pinata/sdk");
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";

const pinata = new pinataSDK({ pinataJWTKey: env.PINATA_JWT });

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

const saveFile = async (file: formidable.File) => {
  try {
    const stream = fs.createReadStream(file.filepath);
    const options = {
      pinataMetadata: {
        name: file.originalFilename,
      },
    };
    const response = await pinata.pinFileToIPFS(stream, options);
    fs.unlinkSync(file.filepath);

    return response as PinataResponse;
  } catch (error) {
    throw error;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async function (err, fields, files) {
        if (err) {
          console.log({ err });
          return res.status(500).send("Upload Error");
        }
        const file = files.file as unknown;

        const response = await saveFile(file as formidable.File);
        const { IpfsHash } = response;

        return res.send(IpfsHash);
      });
    } catch (e) {
      console.log(e);
      res.status(500).send("Server Error");
    }
  } else if (req.method === "GET") {
    try {
      const response = await pinata.pinList(
        { pinataJWTKey: process.env.PINATA_JWT },
        {
          pageLimit: 1,
        },
      );
      res.json(response.rows[0]);
    } catch (e) {
      console.log(e);
      res.status(500).send("Server Error");
    }
  }
}
