import { Server } from "stellar-sdk";
import { STELLAR_URL, STROOP } from "../constant";

export async function accountDetails({ userPub }: { userPub: string }) {
  const server = new Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);
  transactionInializer.balances.forEach((balance) => {
    if (
      balance.asset_type === "credit_alphanum12" ||
      balance.asset_type === "credit_alphanum4"
    ) {
      balance.asset_issuer;
    }
  });
  // console.log("acc", transactionInializer);
}

export async function accountDetailsWithHomeDomain({
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

  return filteredBalances;
}

export function balaceToCopy(balance: string): number {
  return Math.floor(Number(balance) / Number(STROOP));
}

export function copyToBalance(copy: number): string {
  const amount = (copy * Number(STROOP)).toFixed(7);
  return amount;
}
