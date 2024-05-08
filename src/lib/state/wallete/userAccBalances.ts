import { create } from "zustand";
import { Horizon, Server } from "stellar-sdk";
import { accountBalances } from "~/lib/stellar/marketplace/test/acc";

type AccBalanceType =
  | Horizon.BalanceLineNative
  | Horizon.BalanceLineAsset<"credit_alphanum4">
  | Horizon.BalanceLineAsset<"credit_alphanum12">
  | Horizon.BalanceLineLiquidityPool;

interface Balance {
  balances: AccBalanceType[] | undefined;
  getXLMBalance: () => string | undefined;
  getAssetBalance: (props: {
    code?: string;
    issuer?: string;
  }) => string | undefined;

  fetch: (pub: string) => Promise<void>;
}

export const useUserStellarAcc = create<Balance>((set, get) => ({
  balances: undefined,
  fetch: async (pub: string) => {
    const balances = await accountBalances({ userPub: pub });
    set({ balances });
    console.log("balances", balances);
  },
  userBalances: undefined,

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
