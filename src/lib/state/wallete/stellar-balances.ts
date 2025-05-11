import { Horizon } from "@stellar/stellar-sdk";
import { accountBalances } from "~/lib/stellar/marketplace/test/acc";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { create } from "zustand";

export type AccBalanceType =
  | Horizon.HorizonApi.BalanceLineNative
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum4">
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum12">
  | Horizon.HorizonApi.BalanceLineLiquidityPool;

interface Balance {
  balances: AccBalanceType[] | undefined;
  getAssetBalance: (props: {
    code?: string;
    issuer?: string;
  }) => string | undefined;
  setBalance: (balances: AccBalanceType[]) => void;
  platformAssetBalance: number;
  setPlatformAssetBalance: (balances: AccBalanceType[]) => void;
  active: boolean;
  setActive: (active: boolean) => void;
  getXLMBalance: () => string | undefined;
  hasTrust: (code: string, issuer: string) => boolean | undefined;
}

export const useUserStellarAcc = create<Balance>((set, get) => ({
  active: false,
  setActive: (active) => {
    set({ active });
  },
  platformAssetBalance: 0,
  balances: undefined,
  setBalance(balances) {
    set({
      balances,
    });
    get().setPlatformAssetBalance(balances);
  },

  getAssetBalance: (props) => {
    const balances = get().balances;
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
            return balance.balance;
          }
        }
      }
    }
  },

  setPlatformAssetBalance: (balances) => {
    for (const balance of balances) {
      if (
        balance.asset_type == "credit_alphanum12" ||
        balance.asset_type == "credit_alphanum4"
      )
        if (
          balance.asset_code == PLATFORM_ASSET.code &&
          balance.asset_issuer == PLATFORM_ASSET.issuer
        ) {
          set({ platformAssetBalance: Number(balance.balance) });
        }
    }
  },
  getXLMBalance: () => {
    const balances = get().balances;
    if (balances) {
      for (const bal of balances) {
        if (bal.asset_type == "native") {
          return bal.balance;
        }
      }
    }
  },

  userAssetsCodeIssuer: [],
  hasTrust: (code, issuer) => {
    const { balances } = get();
    if (!balances) return undefined;
    const trustline = balances.some((balance) => {
      if (
        (balance.asset_type === "credit_alphanum12" ||
          balance.asset_type === "credit_alphanum4") &&
        balance.asset_code === code &&
        balance.asset_issuer === issuer
      ) {
        return true;
      }
    });
    return trustline;
  },
}));

interface CreatorBalance {
  balances: AccBalanceType[] | undefined;
  getXLMBalance: () => string | undefined;
  getAssetBalance: (props: { code?: string; issuer?: string }) => number;

  setBalance: (balances: AccBalanceType[]) => void;
  // fetch: (pub: string) => Promise<void>;
}

export const useCreatorStorageAcc = create<CreatorBalance>((set, get) => ({
  platformAssetBalance: 0,
  balances: undefined,
  setBalance(balances) {
    set({
      balances,
    });
  },

  getAssetBalance: (props) => {
    const balances = get().balances;
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
            return Number(balance.balance);
          }
        }
      }
    }
    return 0;
  },

  getXLMBalance: () => {
    const balances = get().balances;
    if (balances) {
      for (const bal of balances) {
        if (bal.asset_type == "native") {
          return bal.balance;
        }
      }
    }
  },

  userAssetsCodeIssuer: [],
}));
