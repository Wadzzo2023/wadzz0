/**
 * Browser-side uploads straight to S3 with a presigned PUT: hash the file
 * (the signature pins the checksum), then PUT with progress via XHR — fetch
 * still can't report upload progress.
 */

export async function sha256Hex(file: File) {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function putFile(url: string, file: File, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed — check your connection"));
    xhr.send(file);
  });
}

/** What the server needs to sign an upload. */
export async function describeFile(file: File) {
  return { fileName: file.name, fileType: file.type, fileSize: file.size, checksum: await sha256Hex(file) };
}
