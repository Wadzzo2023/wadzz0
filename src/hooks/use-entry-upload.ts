"use client";

import { useCallback, useState } from "react";

import { describeFile, putFile } from "~/lib/upload";
import { api } from "~/utils/api";

export type UploadedMedia = { url: string; name: string; size: number; type: string };
export type PendingFile = { key: string; file: File; progress: number; error?: string };

/** Bounty entry attachments: sign every file, upload each straight to S3 with progress. */
export function useEntryUpload(bountyId: number) {
  const sign = api.bounty.uploadUrls.useMutation();
  const [files, setFiles] = useState<PendingFile[]>([]);
  const patch = (key: string, p: Partial<PendingFile>) => setFiles((fs) => fs.map((f) => (f.key === key ? { ...f, ...p } : f)));

  const uploadAll = useCallback(
    async (pending: PendingFile[]): Promise<UploadedMedia[]> => {
      if (!pending.length) return [];
      const signed = await sign.mutateAsync({ bountyId, files: await Promise.all(pending.map((p) => describeFile(p.file))) });
      return Promise.all(
        pending.map(async (p, i) => {
          const target = signed[i]!;
          try {
            await putFile(target.uploadUrl, p.file, (pct) => patch(p.key, { progress: pct }));
          } catch (e) {
            patch(p.key, { error: e instanceof Error ? e.message : "Upload failed" });
            throw e;
          }
          patch(p.key, { progress: 100 });
          return { url: target.fileUrl, name: p.file.name, size: p.file.size, type: p.file.type };
        }),
      );
    },
    [bountyId, sign],
  );

  const add = useCallback(
    (list: FileList | File[]) =>
      setFiles((fs) => [...fs, ...Array.from(list).map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, progress: 0 }))]),
    [],
  );
  const remove = useCallback((key: string) => setFiles((fs) => fs.filter((f) => f.key !== key)), []);
  const reset = useCallback(() => setFiles([]), []);

  return { files, add, remove, reset, uploadAll };
}
