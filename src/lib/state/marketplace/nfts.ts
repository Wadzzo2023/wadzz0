import { create } from "zustand";
import { JsonDate, NFTPrivacy } from "../types/dbTypes";
import { MarketNFT } from "~/server/api/routers/marketplace";

interface SongStoreType {
  nfts: MarketNFT[];
  userNfts: MarketNFT[];
  userNftIds: string[];
  updateNft: (nft: MarketNFT) => void;
  setUserNftIds: (ids: string[]) => void;
  setNfts: (nfts: MarketNFT[]) => void;
  getWithIds: (ids: string[]) => MarketNFT[];
  getOneNft: (id: string) => MarketNFT | undefined;
  getPublicNfts: () => MarketNFT[];
  getNftsWithAsset: () => MarketNFT[]; // marketplace
  getMarketplaceNfts: () => MarketNFT[];
  search: (searchString: string) => MarketNFT[];
  setUserNfts: (codeIssuer: string[]) => void;
}

export const useNftStore = create<SongStoreType>((set, get) => ({
  nfts: [],
  userNfts: [],
  userNftIds: [],
  setUserNftIds: (ids) => set({ userNftIds: ids }),
  setNfts: (nfts) => set({ nfts }),
  getWithIds: (ids) => get().nfts.filter((nft) => ids.includes(nft.id)),
  getOneNft: (id) => {
    for (const nft of get().nfts) {
      if (nft.id == id) {
        return nft;
      }
    }
  },
  getPublicNfts: () =>
    get().nfts.filter((nft) => nft.privacy == NFTPrivacy.NOT_FOR_SALE),
  getNftsWithAsset: () => get().nfts.filter((nft) => nft.nftAsset != undefined),

  setUserNfts: (items: string[]) => {
    // this user nfts fetched from user balance and matched iwth toml doc. and filtered from all nfts.
    const userNfts = get().nfts.filter((nft) => {
      if (nft.path.startsWith("nfts")) {
        const nftCodeIssuer = `${nft.nftAsset.code}-${nft.nftAsset.issuer.pub}`;
        return items.includes(nftCodeIssuer);
      } else return false;
    });

    set({ userNfts });
  },

  search: (searchString) => {
    searchString = searchString.toLowerCase();
    const searchTerms = searchString.split(" ");

    return get().nfts.filter((nft) => {
      const { name, nftAsset, description } = nft;
      const nftInfo = [name.toLowerCase(), description.toLowerCase()];

      if (nftAsset?.code) {
        nftInfo.push(nftAsset.code.toLowerCase());
      }

      return searchTerms.every((term) =>
        nftInfo.some((info) => info.includes(term)),
      );
    });
  },
  getMarketplaceNfts: () => {
    // original NFTs from nfts.
    const nfts = get().nfts.filter((nft) => nft.nftAsset != undefined);
    return nfts;
  },
  updateNft: (nft) => {
    const nfts = get().nfts.map((n) => {
      if (n.id == nft.id) {
        return nft;
      }
      return n;
    });
    set({ nfts });
  },
}));
