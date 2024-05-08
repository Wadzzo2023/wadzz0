import { Server } from "stellar-sdk";
import { STELLAR_URL, STROOP } from "../constant";
import { PLATFROM_ASSET } from "../../fan/constant";
import { Horizon } from "stellar-sdk";

type Balances = (
  | Horizon.BalanceLineNative
  | Horizon.BalanceLineAsset<"credit_alphanum4">
  | Horizon.BalanceLineAsset<"credit_alphanum12">
  | Horizon.BalanceLineLiquidityPool
)[];

export async function accountBalances({ userPub }: { userPub: string }) {
  const server = new Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);
  const balances = transactionInializer.balances;

  return balances;
  // console.log("acc", transactionInializer);
}

export async function getAssetBalance({
  pubkey,
  code,
  issuer,
}: {
  pubkey: string;

  code: string;
  issuer: string;
}) {
  const balances = await accountBalances({ userPub: pubkey });

  const asset = balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (balance.asset_code === code && balance.asset_issuer === issuer)
        return balance.balance;
    }
  });

  return asset;
}

export function getAssetBalanceFromBalance({
  balances,
  code,
  issuer,
  native = false,
}: {
  balances?: Balances;
  code?: string;
  issuer?: string;
  native?: boolean;
}) {
  if (!balances || !code || !issuer) return 0;
  for (const balance of balances) {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      if (balance.asset_code === code && balance.asset_issuer === issuer)
        return parseFloat(balance.balance);
    }
    if (balance.asset_type === "native") {
      if (native) return parseFloat(balance.balance);
    }
  }

  return 0;
}

export async function accountDetailsWithHomeDomain({
  userPub,
}: {
  userPub: string;
}) {
  const server = new Server(STELLAR_URL);

  const account = await server.loadAccount(userPub);

  let xlmBalance = 0;
  let siteAssetBalance = 0;

  const balances = await Promise.all(
    account.balances.map(async (balance) => {
      if (
        balance.asset_type === "credit_alphanum12" ||
        balance.asset_type === "credit_alphanum4"
      ) {
        if (balance.is_authorized) {
          const issuerAccount = await server.loadAccount(balance.asset_issuer);
          if (issuerAccount.home_domain) {
            const copies = balaceToCopy(balance.balance);
            if (copies > 0) {
              return {
                code: balance.asset_code,
                issuer: balance.asset_issuer,
                homeDomain: issuerAccount.home_domain,
                copies,
              };
            }
          }
        }
        if (
          balance.asset_code == PLATFROM_ASSET.code &&
          balance.asset_issuer == PLATFROM_ASSET.issuer
        ) {
          siteAssetBalance = parseFloat(balance.balance);
        }
      }
      if (balance.asset_type === "native") {
        xlmBalance = parseFloat(balance.balance);
      }
    }),
  );

  const filteredBalances = balances.filter(
    (
      balance,
    ): balance is {
      code: string;
      issuer: string;
      homeDomain: string;
      copies: number;
    } => {
      if (balance !== undefined) {
        return true;
      } else return false;
    },
  );

  // const testAsset = {
  //   code: "admin",
  //   issuer: "GCKH5NOGA2JLNZTAAFUILRRJKM7RFCNXBPD65ZSS7U662U7ZLYLWKOEQ",
  //   homeDomain: "music.bandcoin.com",
  //   copies: 30,
  // };

  // filteredBalances.push(testAsset);

  return { tokens: filteredBalances, xlmBalance, siteAssetBalance };
}

export function balaceToCopy(balance: string): number {
  return Math.floor(Number(balance) / Number(STROOP));
}

export function copyToBalance(copy: number): string {
  const amount = (copy * Number(STROOP)).toFixed(7);
  return amount;
}

export async function getAccounXLM_PlatformBalance({
  userPub,
}: {
  userPub: string;
}) {
  const { xlmBalance, siteAssetBalance } = await accountDetailsWithHomeDomain({
    userPub,
  });
  return { xlmBalance, siteAssetBalance };
}
