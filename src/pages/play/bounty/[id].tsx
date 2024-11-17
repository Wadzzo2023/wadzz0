"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { ArrowLeft } from "lucide-react";
// import parse from "html-react-parser";
import { toast } from "react-hot-toast";

import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";
import { Badge } from "~/components/shadcn/ui/badge";
import { Progress } from "~/components/shadcn/ui/progress";

import { useBounty } from "~/lib/state/play/useBounty";
import { Bounty } from "~/types/game/bounty";
import { z } from "zod";
import { addrShort } from "~/utils/utils";
import { UploadSubmission } from "~/lib/play/upload-submission";
import { Preview } from "~/components/preview";
import { storage } from "package/connect_wallet/src/lib/firebase/firebase-auth";

type UploadProgress = Record<string, number>;

export const SubmissionMediaInfo = z.object({
  url: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
});

type SubmissionMediaInfoType = z.TypeOf<typeof SubmissionMediaInfo>;

export type FileItem =
  | File
  | { name: string; size: number; type: string; downloadableURL?: string };

const SingleBountyItem = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("information");
  const [solution, setSolution] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [media, setMedia] = useState<SubmissionMediaInfoType[]>([]);
  const [uploadFiles, setUploadFiles] = useState<FileItem[]>([]);
  const queryClient = useQueryClient();
  const { data } = useBounty();

  const { item: bounty } = data;

  const addMediaItem = (
    url: string,
    name: string,
    size?: number,
    type?: string,
  ) => {
    if (size && type) {
      setMedia((prevMedia) => [...prevMedia, { url, name, size, type }]);
    }
  };

  const createBountyAttachmentMutation = useMutation({
    mutationFn: async ({
      bountyId,
      content,
      media,
    }: {
      bountyId: string;
      content: string;
      media?: SubmissionMediaInfoType[];
    }) => {
      return await UploadSubmission({ bountyId, content, media });
    },
    onSuccess: async () => {
      toast.success("Solution submitted successfully");
      setMedia([]);
      setSolution("");
      setUploadFiles([]);
      setUploadProgress({});
      await queryClient.invalidateQueries({ queryKey: ["bounties"] });
    },
    onError: (error) => {
      console.error("Error following bounty:", error);
    },
  });

  if (!bounty) return null;

  const handleSubmitSolution = () => {
    createBountyAttachmentMutation.mutate({
      content: solution,
      bountyId: bounty.id ?? "0",
      media: media,
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadFiles((prevFiles) => [...prevFiles, ...fileArray]);
      await uploadDocuments(fileArray);
    }
  };

  const uploadDocuments = async (files: File[]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      files.forEach(async (file) => {
        const response = await fetch(URL.createObjectURL(file));
        const blob = await response.blob();
        const fileName = file.name;

        if (
          uploadFiles.some((existingFile) => existingFile.name === fileName)
        ) {
          return;
        }

        const storageRef = ref(
          storage,
          `wadzzo/bounty/${bounty.id}/${fileName}/${new Date().getTime()}`,
        );
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress((prevProgress) => ({
              ...prevProgress,
              [fileName]: progress,
            }));
          },
          (error) => {
            console.error("Upload error:", error);
          },
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            setUploadFiles((prevFiles) => {
              return prevFiles.map((prevFile) =>
                prevFile.name === fileName
                  ? {
                      name: fileName,
                      size: file.size,
                      type: file.type,
                      downloadableURL: downloadURL,
                    }
                  : prevFile,
              );
            });

            addMediaItem(downloadURL, file.name, file.size, file.type);
          },
        );
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  const getStatusColor = (status: Bounty["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-500";
      case "REJECTED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto  p-2  pb-16">
      <div className="mb-4 flex items-center rounded-b-2xl bg-[#38C02B] p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">{bounty.title}</h1>
      </div>

      <div className="mb-4">
        <Image
          src={
            bounty.imageUrls[0] ?? "https://app.wadzzo.com/images/loading.png"
          }
          alt={bounty.title}
          width={800}
          height={400}
          className="h-48 w-full rounded-lg object-cover"
        />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Bounty Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={getStatusColor(bounty.status)}>
            {bounty.status}
          </Badge>
          <div className="flex flex-col gap-2">
            <p className="font-bold">Prize: ${bounty.priceInUSD.toFixed(2)}</p>
            <p className="font-bold">
              Prize: {bounty.priceInBand.toFixed(2)} Wadzzo
            </p>
            <p>Participants: {bounty._count.participants}</p>
          </div>
        </CardContent>
      </Card>

      {uploadFiles.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            {uploadFiles.map((file, index) => (
              <div key={index} className="mb-2">
                <p className="text-sm font-medium">{file.name}</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={uploadProgress[file.name] ?? 0}
                    className="flex-grow"
                  />
                  <span className="text-sm">
                    {uploadProgress[file.name]?.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 ">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="submission">Submission</TabsTrigger>
        </TabsList>
        <TabsContent value="information">
          <Card className="overflow-y-auto">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <Preview value={bounty.description} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="submission">
          {bounty.winnerId === null ? (
            <Card className="overflow-y-auto">
              <CardHeader>
                <CardTitle>Submit Your Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Your Solution (Required)"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="mb-4"
                />
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mb-4"
                />
                <Button
                  onClick={handleSubmitSolution}
                  disabled={
                    solution.length === 0 ||
                    createBountyAttachmentMutation.isLoading
                  }
                >
                  Submit Solution
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <p className="font-bold text-green-600">
                  Winner: {addrShort(bounty.winnerId, 15)}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SingleBountyItem;
