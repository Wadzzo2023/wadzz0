import { create } from "zustand";
import { Song } from "../types/dbTypes";
import { OfflineSongs } from "../firebase/offiledb";
import { Horizon } from "stellar-sdk";
import { DEFAULT_ASSET_LIMIT } from "../stellar/constant";
import { BalanceType } from "../stellar/trx/create_song_token";

interface Balance {
  storageBalances?: BalanceType[];
  userBalances?: BalanceType[];
  setUserBalances: (balances: BalanceType[]) => void;
  setBalances: (balances: BalanceType[]) => void;
  getAssetBalance: (props: {
    code?: string;
    issuer?: string;
    limit: boolean;
    for: Balance4;
  }) => string | undefined;
  setUserAssets: (balances: BalanceType[]) => void;
  userAssets?: string[];
}

export const useBalanceStore = create<Balance>((set, get) => ({
  setBalances: (balances) => set({ storageBalances: balances }),
  setUserBalances: (balances) => set({ userBalances: balances }),
  setUserAssets(balances) {
    const storageAsset = get().storageBalances?.map((el) => el.asset);
    const userAssets = balances
      .filter((balance) => storageAsset?.includes(balance.asset))
      .map((el) => el.asset);
    set({ userAssets });
  },
  getAssetBalance: (props) => {
    let balances: BalanceType[] | undefined;
    if (props.for == Balance4.STORAGE) {
      balances = get().storageBalances;
    } else {
      balances = get().userBalances;
    }

    if (balances) {
      for (const balance of balances) {
        if (balance.asset == `${props.code}-${props.issuer}`) {
          if (props.limit) {
            return Math.floor(
              Number(balance.balance) / Number(DEFAULT_ASSET_LIMIT),
            ).toString();
          } else return balance.balance;
        }
      }
    }
  },
}));

export enum Balance4 {
  USER = "user",
  STORAGE = "storage",
}
