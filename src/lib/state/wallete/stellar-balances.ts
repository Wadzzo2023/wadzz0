import { create } from "zustand";
import { Horizon } from "@stellar/stellar-sdk";
import { accountBalances } from "~/lib/stellar/marketplace/test/acc";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";

export type AccBalanceType =
  | Horizon.HorizonApi.BalanceLineNative
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum4">
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum12">
  | Horizon.HorizonApi.BalanceLineLiquidityPool;

interface Balance {
 balances: AccBalanceType[] | undefined;
  getAssetBalance: (props: { code?: string; issuer?: string }) => string | undefined;
  setBalance: (balances: AccBalanceType[]) => void;
  platformAssetBalance: number ;
  setPlatformAssetBalance: (balances: AccBalanceType[]) => void;
  active: boolean;
  setActive: (active: boolean) => void;
  hasTrustLine: boolean;
  setHasTrustLine: (balances: AccBalanceType[]) => void;
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
    // console.log(
    //   // "...balances...",
    //   balances,
    //   PLATFROM_ASSET,
    //   get().platformAssetBalance,
    // );
  },

  hasTrustLine: false,

  setHasTrustLine: (balances) => {
    const findAsset = balances.find((balance) => {
      console.log('Checking balance:', balance);
      if (
        (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') &&
        balance.asset_code === PLATFROM_ASSET.code &&
        balance.asset_issuer === PLATFROM_ASSET.issuer
      ) {
        return true;
      }
      return false;
    });

    if (findAsset) {
      set({ hasTrustLine: true });
      console.log('Trustline found:', findAsset);
    } else {
      set({ hasTrustLine: false });
      console.log('Trustline not found');
    }
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
          balance.asset_code == PLATFROM_ASSET.code &&
          balance.asset_issuer == PLATFROM_ASSET.issuer
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
