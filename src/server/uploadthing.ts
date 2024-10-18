import type { NextApiRequest, NextApiResponse } from "next";

import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";

const f = createUploadthing();

const auth = (req: NextApiRequest, res: NextApiResponse) => ({ id: "fakeId" }); // Fake auth function

export const ourFileRouter = {

  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })

    .middleware(async ({ req, res }) => {

      const user = await auth(req, res);

      if (!user) throw new Error("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      console.log("Upload complete for userId:", metadata.userId);

      return { uploadedBy: metadata.userId };
    }),
  SubmissionImageUploader: f({ blob: { maxFileSize: "1024MB", maxFileCount: 5 } })

    .middleware(async ({ req, res }) => {

      const user = await auth(req, res);

      if (!user) throw new Error("Unauthorized");

      return { userId: user.id };
    }).onUploadError((error) => {
      return error;
    })
    .onUploadComplete(async ({ metadata, file }) => {

      console.log("Upload complete for userId:", metadata.userId);

      return { uploadedBy: metadata.userId };
    }),

  musicUploader: f({ audio: { maxFileSize: "64MB", maxFileCount: 1, } })
    .middleware(async ({ req, res }) => {

      const user = await auth(req, res);


      if (!user) throw new Error("Unauthorized");


      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      return { uploadedBy: metadata.userId };
    }),

  videoUploader: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async ({ req, res }) => {

      const user = await auth(req, res);


      if (!user) throw new Error("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);


      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
