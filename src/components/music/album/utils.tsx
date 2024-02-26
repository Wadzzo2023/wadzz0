export function getAlbumBase(id: string) {
  return `root/${id}`;
}
export function getAlbumCoverLocation(albumId: string) {
  const baseLocation = getAlbumBase(albumId);
  const location = `${baseLocation}/cover.jpg`;
  return location;
}
export function getSongCoverLocation(songId: string, albumId: string) {
  const baseLocation = getAlbumBase(albumId);
  const songCoverloc = `${baseLocation}/${songId}/cover.jpg`;
  return songCoverloc;
}

export function getSongSongLocation(albumId: string, songId: string) {
  const baseLocation = getAlbumBase(albumId);
  const songloc = `${baseLocation}/${songId}/song.mp3`;
  return songloc;
}

export function getBannerLocation() {
  return "root/banner.jpg";
}
