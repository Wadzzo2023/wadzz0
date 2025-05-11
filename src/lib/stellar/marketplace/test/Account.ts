import { Horizon } from "@stellar/stellar-sdk";
import { STELLAR_URL } from "../../constant";

type Ballances = (
  | Horizon.HorizonApi.BalanceLineNative
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum4">
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum12">
  | Horizon.HorizonApi.BalanceLineLiquidityPool
)[];

export class StellarAccount {
  private server: Horizon.Server;
  private pubkey: string;
  private balances: Ballances;

  constructor(pubkey: string, balances: Ballances) {
    this.server = new Horizon.Server(STELLAR_URL);
    this.pubkey = pubkey;
    this.balances = balances;
  }

  static async create(pubkey: string) {
    const server = new Horizon.Server(STELLAR_URL);
    const transactionInitializer = await server.loadAccount(pubkey);
    return new StellarAccount(pubkey, transactionInitializer.balances);
  }

  getNativeBalance() {
    return this.balances.find((balance) => {
      if (balance.asset_type === "native") {
        return balance.balance;
      }
    })?.balance;
  }

  getTokenBalance(code: string, issuer: string) {
    const asset = this.balances.find((balance) => {
      if (
        balance.asset_type === "credit_alphanum12" ||
        balance.asset_type === "credit_alphanum4"
      ) {
        if (balance.asset_code === code && balance.asset_issuer === issuer) {
          return true;
        }
      }
    });

    if (asset) {
      return Number(asset.balance);
    } else return 0;
  }

  hasTrustline(code: string, issuer: string) {
    const trustline = this.balances.find((balance) => {
      if (
        (balance.asset_type === "credit_alphanum12" ||
          balance.asset_type === "credit_alphanum4") &&
        balance.asset_code === code &&
        balance.asset_issuer === issuer
      ) {
        return true;
      }
    });

    return !!trustline;
  }
}
