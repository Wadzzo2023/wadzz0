import { z } from "zod";
import { BASE_URL } from "../common";
export const SubmissionMediaInfo = z.object({
  url: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
});

type SubmissionMediaInfoType = z.TypeOf<typeof SubmissionMediaInfo>;

export const UploadSubmission = async ({
  bountyId,
  content,
  media,
}: {
  bountyId: string;
  content: string;
  media?: SubmissionMediaInfoType[];
}) => {
  try {
    const response = await fetch(
      new URL(
        "api/game/bounty/submission/create-submission",
        BASE_URL,
      ).toString(),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bountyId: bountyId.toString(),
          content: content,
          media: media,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to submit this submission ");
    }

    const data = await response.json() as { success: boolean };
    return data;
  } catch (error) {
    console.error("Error failed to submit this submission:", error);
    throw error;
  }
};
