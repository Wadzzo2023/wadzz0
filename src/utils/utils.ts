import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function addrShort(addr: string | undefined, size?: number) {
  const cropSize = size ?? 3;
  if (!addr) {
    return "";
  }
  if (addr.length <= cropSize * 2) {
    return addr;
  }
  return `${addr.substring(0, cropSize)}...${addr.substring(
    addr.length - cropSize,
    addr.length,
  )}`;
}

export async function delay(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export function checkPubkey(pubkey: string): boolean {
  return !pubkey || pubkey.trim() === "" || !(pubkey.length === 56);
}

export const downloadAttachment = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};
