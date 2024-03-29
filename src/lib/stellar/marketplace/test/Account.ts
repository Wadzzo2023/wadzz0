import { Horizon, Server } from "stellar-sdk";
import { STELLAR_URL } from "../constant";
import { balaceToCopy } from "./acc";

type Ballance = (
  | Horizon.BalanceLineNative
  | Horizon.BalanceLineAsset<"credit_alphanum4">
  | Horizon.BalanceLineAsset<"credit_alphanum12">
  | Horizon.BalanceLineLiquidityPool
)[];

export class StellarAccount {
  private server: Server;
  private pubkey: string;
  private balances: Ballance;

  constructor(pubkey: string) {
    this.server = new Server(STELLAR_URL);
    this.pubkey = pubkey;
    this.balances = [];
  }

  async initializeAccountBalances() {
    const transactionInitializer = await this.server.loadAccount(this.pubkey);
    this.balances = transactionInitializer.balances;
  }

  async getNativeBalance() {
    return this.balances.find((balance) => {
      if (balance.asset_type === "native") {
        return balance.balance;
      }
    })?.balance;
  }

  async getTokenBalance(code: string, issuer: string) {
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
      return balaceToCopy(asset.balance);
    } else return 0;
  }
}
