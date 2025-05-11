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
