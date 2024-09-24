import { Horizon } from "@stellar/stellar-sdk";
import { PLATFORM_ASSET, STELLAR_URL, STROOP } from "../../constant";

type Balances = (
  | Horizon.HorizonApi.BalanceLineNative
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum4">
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum12">
  | Horizon.HorizonApi.BalanceLineLiquidityPool
)[];

export async function accountBalances({ userPub }: { userPub: string }) {
  const server = new Horizon.Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);
  const balances = transactionInializer.balances;

  return balances;
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

export async function getAccountInfos(pubkey: string) {
  const allBallances = await accountBalances({ userPub: pubkey });
  const platformAssetBal = getAssetBalanceFromBalance({
    balances: allBallances,
    code: PLATFORM_ASSET.code,
    issuer: PLATFORM_ASSET.issuer,
  });
  const xlm = getAssetBalanceFromBalance({
    balances: allBallances,
    native: true,
  });
  return { balances: allBallances, xlm, platformAssetBal };
}

export async function accountDetailsWithHomeDomain({
  userPub,
}: {
  userPub: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const account = await server.loadAccount(userPub);

  let xlmBalance = 0;
  let siteAssetBalance = 0;

  const balances = await Promise.all(
    account.balances.map(async (balance) => {
      if (
        balance.asset_type === "credit_alphanum12" ||
        balance.asset_type === "credit_alphanum4"
      ) {
        if (
          balance.asset_code == PLATFORM_ASSET.code &&
          balance.asset_issuer == PLATFORM_ASSET.issuer
        ) {
          siteAssetBalance = parseFloat(balance.balance);
        }

        if (balance.is_authorized) {
          const issuerAccount = await server.loadAccount(balance.asset_issuer);
          if (issuerAccount.home_domain) {
            const copies = balanceToCopy(balance.balance);
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

  return { tokens: filteredBalances, xlmBalance, siteAssetBalance };
}

function balanceToCopy(balance: string): number {
  // prev implementation stroop = copy
  // return Math.floor(Number(balance) / Number(STROOP));
  // now 1 xlm = 1 copy
  return Number(balance);
}

function copyToBalance(copy: number): string {
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
