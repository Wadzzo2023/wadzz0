import { Asset, Horizon, NetworkError, NotFoundError } from "@stellar/stellar-sdk";

import { BASE_RESERVE_XLM, MAX_SUBENTRIES, PLATFORM_ASSET, STELLAR_URL } from "./constant";

export type Balances = Horizon.HorizonApi.AccountResponse["balances"];
export type AssetRef = { code: string; issuer: string };

export const horizon = () => new Horizon.Server(STELLAR_URL);

export const toAsset = ({ code, issuer }: AssetRef) => new Asset(code, issuer);

/**
 * A loaded Stellar account with the questions every transaction check asks:
 * does it trust an asset, how much does it hold, how much XLM is actually
 * spendable once reserves and open offers are set aside.
 */
export class StellarAccount {
  private constructor(
    readonly id: string,
    readonly raw: Horizon.AccountResponse,
  ) {}

  /**
   * The account, or null when it doesn't exist on-chain yet. An id Horizon rejects as malformed
   * (400) is treated the same way: no account, rather than a "Bad Request" error on the page.
   */
  static async load(id: string): Promise<StellarAccount | null> {
    try {
      return new StellarAccount(id, await horizon().loadAccount(id));
    } catch (e) {
      if (e instanceof NotFoundError) return null;
      // Horizon answers 400 for an id it can't parse; stellar-sdk raises that as a NetworkError
      // whose response status is 400 (message "Bad Request"), not as BadRequestError.
      if (e instanceof NetworkError && e.getResponse().status === 400) {
        console.warn(`[stellar] not a valid account id: ${id.slice(0, 8)}…`);
        return null;
      }
      throw e;
    }
  }

  static async loadOrThrow(id: string, label = "Account"): Promise<StellarAccount> {
    const acc = await StellarAccount.load(id);
    if (!acc) throw new Error(`${label} ${id.slice(0, 6)}… is not active on Stellar`);
    return acc;
  }

  get balances(): Balances {
    return this.raw.balances;
  }

  get subentries() {
    return this.raw.subentry_count;
  }

  private line(code: string, issuer: string) {
    return this.balances.find(
      (b) =>
        (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") &&
        b.asset_code === code &&
        b.asset_issuer === issuer,
    ) as Horizon.HorizonApi.BalanceLineAsset | undefined;
  }

  hasTrustline(code: string, issuer: string) {
    return Boolean(this.line(code, issuer));
  }

  /** Balance of an asset (0 without a trustline). The issuer holds unlimited of its own asset. */
  tokenBalance(code: string, issuer: string) {
    return Number(this.line(code, issuer)?.balance ?? 0);
  }

  /** How many more units of the asset the trustline accepts (Infinity if not limited). */
  tokenRoom(code: string, issuer: string) {
    const l = this.line(code, issuer);
    if (!l) return 0;
    return Number(l.limit) - Number(l.balance) - Number(l.buying_liabilities);
  }

  platformBalance() {
    return this.tokenBalance(PLATFORM_ASSET.code, PLATFORM_ASSET.issuer);
  }

  trustsPlatformAsset() {
    return this.hasTrustline(PLATFORM_ASSET.code, PLATFORM_ASSET.issuer);
  }

  nativeBalance() {
    const n = this.balances.find((b) => b.asset_type === "native") as Horizon.HorizonApi.BalanceLineNative | undefined;
    return Number(n?.balance ?? 0);
  }

  /** XLM locked by the account itself: (2 + subentries + sponsoring − sponsored) × 0.5. */
  minimumBalance() {
    // Horizon returns these; the SDK's AccountResponse type just doesn't declare them.
    const { num_sponsoring = 0, num_sponsored = 0 } = this.raw as unknown as { num_sponsoring?: number; num_sponsored?: number };
    return (2 + this.subentries + num_sponsoring - num_sponsored) * BASE_RESERVE_XLM;
  }

  /** XLM that can be spent right now (balance − reserves − XLM locked in sell offers). */
  spendableXlm() {
    const n = this.balances.find((b) => b.asset_type === "native") as Horizon.HorizonApi.BalanceLineNative | undefined;
    const selling = Number(n?.selling_liabilities ?? 0);
    return Math.max(0, this.nativeBalance() - this.minimumBalance() - selling);
  }

  canAddSubentries(count = 1) {
    return this.subentries + count <= MAX_SUBENTRIES;
  }
}

/** Whether a transaction with this hash made it on-chain successfully (null = not found yet). */
export async function transactionSucceeded(hash: string): Promise<boolean | null> {
  try {
    const tx = await horizon().transactions().transaction(hash).call();
    return tx.successful;
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}
