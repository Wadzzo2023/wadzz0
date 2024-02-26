import { create } from "zustand";
import { Horizon } from "stellar-sdk";
import { DEFAULT_ASSET_LIMIT } from "../stellar/constant";
import { SITE_ASSET_OBJ } from "../stellar/trx/constant";

type AccBalanceType =
  | Horizon.BalanceLineNative
  | Horizon.BalanceLineAsset<"credit_alphanum4">
  | Horizon.BalanceLineAsset<"credit_alphanum12">
  | Horizon.BalanceLineLiquidityPool;

interface Balance {
  storageBalances: AccBalanceType[] | undefined;
  setBalances: (balances: AccBalanceType[] | undefined) => void;

  userBalances: AccBalanceType[] | undefined;
  setUserBalances: (balances: AccBalanceType[] | undefined) => void;
  getAssetBalance: (props: {
    code?: string;
    issuer?: string;
    limit: boolean;
    for: Balance4;
  }) => string | undefined;
  getUserXLMBalance: () => string | undefined;
  getUserSiteAssetBalance: () => string | undefined;
  userAssetsCodeIssuer: string[];
}

export const useBalanceStore = create<Balance>((set, get) => ({
  storageBalances: undefined,
  userBalances: undefined,
  setBalances: (balances) => set({ storageBalances: balances }),
  setUserBalances: (balances) => {
    set({ userBalances: balances });

    //
    const codeIssuer: string[] = [];
    if (balances) {
      for (const balance of balances) {
        if (
          balance.asset_type == "credit_alphanum12" ||
          balance.asset_type == "credit_alphanum4"
        ) {
          codeIssuer.push(`${balance.asset_code}-${balance.asset_issuer}`);
        }
      }
    }

    set({ userAssetsCodeIssuer: codeIssuer });
  },
  getAssetBalance: (props) => {
    let balances: AccBalanceType[] | undefined;
    if (props.for == Balance4.STORAGE) {
      balances = get().storageBalances;
    } else {
      balances = get().userBalances;
    }
    if (balances) {
      for (const balance of balances) {
        if (
          balance.asset_type == "credit_alphanum12" ||
          balance.asset_type == "credit_alphanum4"
        ) {
          if (
            balance.asset_code == props.code &&
            balance.asset_issuer == props.issuer
          ) {
            if (props.limit) {
              return Math.floor(
                Number(balance.balance) / Number(DEFAULT_ASSET_LIMIT),
              ).toString();
            } else return balance.balance;
          }
        }
      }
    }
  },

  getUserXLMBalance: () => {
    const balances = get().userBalances;
    if (balances) {
      for (const bal of balances) {
        if (bal.asset_type == "native") {
          return bal.balance;
        }
      }
    }
  },
  getUserSiteAssetBalance() {
    const balances = get().userBalances;
    // return balances ? balances[0]?.balance.toString() : "";

    if (balances) {
      for (const bal of balances) {
        if (
          bal.asset_type == "credit_alphanum12" ||
          bal.asset_type == "credit_alphanum4"
        ) {
          if (
            bal.asset_code == SITE_ASSET_OBJ.asset_code
            // bal.asset_code == wadzooAssetObj.asset_issuer
          ) {
            if (bal.is_authorized) {
              return bal.balance;
            }
          }
        }
      }
    }
  },
  userAssetsCodeIssuer: [],
}));

export enum Balance4 {
  USER = "user",
  STORAGE = "storage",
}
