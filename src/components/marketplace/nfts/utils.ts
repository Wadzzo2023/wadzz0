import { NFT } from "~/lib/types/dbTypes";

export function getBase() {
  return `root/`;
}

export function getNftThumbnailLocation(nftId: string, fileExt: string) {
  const baseLocation = getBase();
  const songCoverloc = `${baseLocation}/${nftId}/cover.${fileExt}`;
  return songCoverloc;
}

export function getNftMediaLocation(nftId: string, fileExt: string) {
  const baseLocation = getBase();
  const songloc = `${baseLocation}/${nftId}/media.${fileExt}`;
  return songloc;
}

export function getBannerLocation() {
  return "root/banner.jpg";
}

export function generateSlugFromAlbumName(albumName: string) {
  // Convert to lowercase and replace spaces with dashes
  const slug = albumName.toLowerCase().replace(/\s+/g, "-");

  // Remove special characters (alphanumeric characters and dashes allowed)
  const cleanSlug = slug.replace(/[^a-z0-9-]/g, "");

  return cleanSlug;
}

export function generateHashIdFromName(collectionName: string): string {
  const hashCode: number = collectionName
    .split("")
    .reduce((acc: number, char: string) => {
      return acc + char.charCodeAt(0);
    }, 0);

  const id: string = hashCode.toString(16);

  return id;
}

export const DEFAULT_COVER =
  "https://firebasestorage.googleapis.com/v0/b/music-dev-6ce46.appspot.com/o/root%2F336%2F32c%2Fcover.jpg?alt=media&token=863ba0d5-4236-47b3-94a8-53e434e12f01";
