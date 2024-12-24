import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "~/components/shadcn/ui/input";
import { api } from "~/utils/api";

import axios, { AxiosError } from "axios";
import { EndPointType } from "~/server/s3";
import { Progress } from "~/components/shadcn/ui/progress";

export default function TestPage() {
  return (
    <div>
      <UploadS3Button endpoint="videoUploader" />
    </div>
  );
}

const computeSHA256 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

export function UploadS3Button({
  endpoint,
  onBeforeUploadBegin,
  onUploadProgress,
  onClientUploadComplete,
  onUploadError,
  disabled,
}: {
  endpoint: EndPointType;
  onUploadProgress?: (p: number) => void;
  onClientUploadComplete?: (file: { url: string }) => void;
  onBeforeUploadBegin?: (files: File) => Promise<File> | File;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  const url = api.s3.getSignedURL.useMutation({
    onSuccess: async (data) => {
      setLoading(true);
      try {
        if (file) {
          const res = await axios.put(data.uploadUrl, file, {
            headers: {
              "Content-Type": file.type,
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentage = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total,
                );
                setProgress(percentage);
                onUploadProgress?.(percentage);
              }
            },
          });

          if (res.status === 200) {
            onClientUploadComplete?.({ url: data.fileUrl });
          }
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Status:", error.response?.status);
          console.error("Message:", error.message);
          console.error("Response data:", error.response?.data);
          onUploadError?.(error);
        }
        console.error("Failed to upload file", error);
      } finally {
        setLoading(false);
        console.log("File uploaded successfully", data);
      }
    },
    onError: (error) => {
      toast.error("Failed to get signed URL");
      console.error("Failed to get signed URL", error);
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      let targetFile = file;
      if (onBeforeUploadBegin) {
        const processedFile = await onBeforeUploadBegin(file);
        if (!processedFile) {
          return;
        }
        targetFile = processedFile;
      }

      setFile(targetFile);
      url.mutate({
        fileSize: targetFile.size,
        fileType: targetFile.type,
        checksum: await computeSHA256(targetFile),
        endPoint: endpoint,
      });
      console.log(`Selected file: ${targetFile.name}`);
    } else {
      console.error("No file selected");
    }
  };

  return (
    <div className="grid w-full  items-center gap-1.5">
      {loading && <div>Uploading...</div>}
      <Input
        onChange={handleFileChange}
        id="picture"
        disabled={disabled}
        type="file"
        className="bg-slate-200"
        accept={getAcceptString()}
      />

      <Progress
        className="w-full"
        value={progress}

        style={{ height: "0.5rem" }}
      />
    </div>
  );

  function getAcceptString() {
    switch (endpoint) {
      case "imageUploader":
        return "image/jpeg,image/png,image/webp,image/gif";
      case "videoUploader":
        return "video/mp4,video/webm";
      case "musicUploader":
        return "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/alac,audio/aiff,audio/wma,audio/m4a";
    }
  }
}
