import { Server } from "stellar-sdk";
import { STELLAR_URL, STROOP } from "./constant";
import { PLATFROM_ASSET } from "./constant";
import { type Horizon } from "stellar-sdk";

export type Balances = (
  | Horizon.BalanceLineNative
  | Horizon.BalanceLineAsset<"credit_alphanum4">
  | Horizon.BalanceLineAsset<"credit_alphanum12">
  | Horizon.BalanceLineLiquidityPool
)[];

export async function NativeBalance ({ userPub }: { userPub: string }) {
  const server = new Server(STELLAR_URL);

  const account = await server.loadAccount(userPub);

  const nativeBalance = account.balances.find(
    (balance) => balance.asset_type === "native",
  );

  return nativeBalance;
}


export async function BalanceWithHomeDomain({
  userPub,
}: {
  userPub: string;
}) {
  const server = new Server(STELLAR_URL);

  const account = await server.loadAccount(userPub);
  const balances = await Promise.all(
    account.balances.map(async (balance) => {
      if (
        balance.asset_type === "credit_alphanum12" ||
        balance.asset_type === "credit_alphanum4"
      ) {
        if (balance.is_authorized) {
          const issuerAccount = await server.loadAccount(balance.asset_issuer);
          if (issuerAccount.home_domain) {
             return {
              ...balance,
              home_domain: issuerAccount.home_domain,
              asset_code: balance.asset_code,
             }
            
            }
            else{
            return {
              ...balance,
              home_domain: null,
              asset_code: balance.asset_code,
            }
          }
          }
          else{
            return {
              ...balance,
              home_domain: null,
              asset_code: balance.asset_code,
            }
          }
        }
      else{
        return {
          ...balance,
          home_domain: null,
          asset_code: "",
        }
      }
      }),
  );
  console.log(balances);
  return balances;
}


