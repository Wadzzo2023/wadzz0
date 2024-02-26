import { create } from "zustand";
import { MarketNFT } from "~/server/api/routers/marketplace/marketplace";

interface FetchedNFTState {
  marketNFTs: MarketNFT[];
  setMarketNFTs: (nfts: MarketNFT[]) => void;
  userNFTs: MarketNFT[];
  setUserNFTs: (nfts: MarketNFT[]) => void;
  search: (searchString: string) => MarketNFT[];
}

export const useFetchedNFTStore = create<FetchedNFTState>((set, get) => ({
  marketNFTs: [],
  userNFTs: [],
  setMarketNFTs(nfts) {
    set({ marketNFTs: nfts });
  },
  setUserNFTs(nfts) {
    set({ userNFTs: nfts });
  },
  search(searchString) {
    searchString = searchString.toLowerCase();
    const searchTerms = searchString.split(" ");

    return get().marketNFTs.filter((nft) => {
      const { name, description, nftAsset } = nft;
      const nftInfo = [
        name.toLowerCase(),
        description.toLowerCase(),
        nftAsset.code.toLowerCase(),
      ];

      return searchTerms.every((term) =>
        nftInfo.some((info) => info.includes(term)),
      );
    });
  },
}));
