import { create } from "zustand";
import { Album } from "~/lib/music/types/dbTypes";

interface AlbumStore {
  albums: Album[];
  getAlbum: (id: string) => Album | undefined;
  setAlbums: (albums: Album[]) => void;
  getAlbumSongsIds: (id: string) => string[];
  search: (searchString: string) => Album[];
}

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  albums: [],
  setAlbums: (albums) => set({ albums }),
  getAlbum: (id) => {
    for (const album of get().albums) {
      if (album.id == id) {
        return album;
      }
    }
  },
  getAlbumSongsIds: (id) => {
    for (const album of get().albums) {
      if (album.id == id) {
        return album.songs ?? [];
      }
    }
    return [];
  },
  search: (searchString) => {
    searchString = searchString.toLowerCase();
    const searchTerms = searchString.split(" ");

    return get().albums.filter((album) => {
      const { name, description } = album;
      const albumInfo = [name.toLowerCase(), description.toLowerCase()];

      return searchTerms.every((term) =>
        albumInfo.some((info) => info.includes(term)),
      );
    });
  },
}));
