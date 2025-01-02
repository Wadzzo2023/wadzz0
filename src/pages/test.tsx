import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "~/components/shadcn/ui/input";
import { api } from "~/utils/api";

import axios, { AxiosError } from "axios";
import { EndPointType } from "~/server/s3";
import { Progress } from "~/components/shadcn/ui/progress";
import { allowedSubmissionTypes } from "~/components/modals/file-upload-modal";
import { Button } from "~/components/shadcn/ui/button";
import { Loader2, Upload } from "lucide-react";

export default function TestPage() {
  return (
    <div>
      <UploadS3Button endpoint="blobUploader" />
      <MultiUploadS3Button
        onClientUploadComplete={(files) => {
          console.log(files)
        }}
      />
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
      toast.error(error.message);

    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const isOBJFile = file.name.endsWith(".obj") && file.type === "";
      const fileType = isOBJFile ? ".obj" : file.type;

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
        fileType: fileType,
        checksum: await computeSHA256(targetFile),
        endPoint: endpoint,
        fileName: targetFile.name,
      });

    } else {
      console.error("No file selected");
    }
  };

  return (
    <div className="grid w-full items-center gap-2">
      <Button
        variant="default"
        type="button"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={disabled ?? loading}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {loading ? 'Uploading...' : 'Add Media'}
      </Button>
      <input
        id="file-upload"
        type="file"
        accept={getAcceptString(endpoint)}
        disabled={disabled ?? loading}
        className="hidden"
        onChange={handleFileChange}
      />
      {loading && (
        <Progress
          value={progress}
          className="h-1 w-full"
        />
      )}
    </div>
  );


}

function getAcceptString(endpoint: EndPointType) {
  switch (endpoint) {
    case "imageUploader":
      return "image/jpeg,image/png,image/webp,image/gif";

    case "videoUploader":
      return "video/mp4,video/webm";

    case "musicUploader":
      return "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/alac,audio/aiff,audio/wma,audio/m4a";

    case "modelUploader":
      return ".obj";

    case "svgUploader":
      return "image/svg+xml";

    case "multiBlobUploader":
      return `
        image/jpeg,image/png,image/webp,image/gif,
        video/mp4,video/webm,
        application/vnd.google-apps.document,
        application/vnd.google-apps.spreadsheet, 
        text/plain,
        application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
        application/vnd.ms-excel, 
        text/csv, 
        text/tab-separated-values, 
        application/pdf, 
        application/vnd.oasis.opendocument.spreadsheet
      `.trim();
  }
}
export function MultiUploadS3Button({
  endpoint = "multiBlobUploader",
  onBeforeUploadBegin,
  onUploadProgress,
  onClientUploadComplete,
  onUploadError,
}: {
  endpoint?: EndPointType;
  onUploadProgress?: (p: number) => void;
  onClientUploadComplete?: (files: {
    url: string; name: string,

    size: number, type: string
  }[]) => void;
  onBeforeUploadBegin?: (files: File[]) => Promise<File[]> | File[];
  onUploadError?: (error: Error) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList>();
  const [completedCount, setCompletedCount] = useState(0);
  const singedUrls = api.s3.getSignedMultiURLs.useMutation({
    onSuccess: async (urls, variables) => {
      setLoading(true);
      const finished: { url: string; name: string, size: number, type: string }[] = [];
      if (!files) return;


      for (const file of files) {
        const data = urls.find((url) => url.fileName === file.name);
        if (!data) continue;



        try {
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
            finished.push({
              url: data.fileUrl, name: file.name, size: file.size, type: file.type

            });
            setCompletedCount(prevCount => prevCount + 1);

          } else {
            // onUploadError?.(new Error("Failed to upload file"));
            console.log(res);
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
        }
      }


      onClientUploadComplete?.(finished);
      setLoading(false);
    },
    onError: (error) => {

      toast.error(error.message);
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileInputs = event.target.files;

    if (fileInputs) {
      let targetFiles = Array.from(fileInputs);

      if (onBeforeUploadBegin) {
        const processedFile = await onBeforeUploadBegin(targetFiles);
        if (!processedFile) {
          return;
        }
        targetFiles = processedFile;
      }

      const filesMeta = await Promise.all(
        targetFiles.map(async (file) => {
          return {
            checksum: await computeSHA256(file),
            fileSize: file.size,
            fileName: file.name,
            fileType: file.type,
            endPoint: endpoint,
          };
        }),
      );


      setFiles(fileInputs);

      singedUrls.mutate({
        files: filesMeta,
        endPoint: endpoint,
      });
    } else {
      console.error("No file selected");
    }
  };

  return (

    <div className="grid w-full items-center gap-2">
      <Button
        variant="default"
        type="button"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={loading}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {loading ? 'Uploading...' : 'Add Media'}
      </Button>
      <input
        id="file-upload"
        type="file"
        accept={getAcceptString(endpoint)}
        disabled={loading}
        className="hidden"
        onChange={handleFileChange}
        multiple
      />
      {loading && (
        <Progress
          value={progress}
          className="h-1 w-full"
        />
      )}
      {loading && <div className="text-sm text-gray-600">Completed: {completedCount}/{files?.length}</div>}

    </div>


  );
}
