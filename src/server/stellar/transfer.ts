import "server-only";

import { Asset, Claimant, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import type { Platform } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { StellarAccount } from "~/lib/stellar/account";
import { BASE_RESERVE_XLM, TX_TIMEOUT_SECONDS, TrxBaseFee, networkPassphrase } from "~/lib/stellar/constant";
import type { CostLine } from "~/lib/stellar/quote";
import type { Db } from "~/server/db";

import { signForUser, type Signer } from "./keys";

type Ctx = { db: Db; platform: Pick<Platform, "id" | "isRoot"> };
const amt = (n: number) => (Math.floor(n * 1e7) / 1e7).toFixed(7);
const FEE_XLM = Number(TrxBaseFee) / 1e7;
/** XLM needed to create a brand-new account (Stellar's minimum is 1 XLM). */
const MIN_NEW_ACCOUNT_XLM = 1;

export type SendInput = { code: string; issuer: string | null; to: string; amount: number };

/**
 * How a send will be delivered:
 * - "payment": the recipient can hold it already
 * - "create":  XLM to an address that doesn't exist yet (opens the account)
 * - "gift":    a token the recipient can't hold yet: sent as a claimable
 *              balance they accept later (same as Pending gifts)
 */
export type SendMode = "payment" | "create" | "gift";

export type SendQuote = {
  mode: SendMode | null;
  code: string;
  amount: number;
  lines: CostLine[];
  /** XLM the sender pays on top of the amount (fee + any reserve) */
  xlmCost: number;
  balance: number;
  ok: boolean;
  problems: string[];
};

const isXlm = (i: SendInput) => i.code === "XLM" && !i.issuer;

export async function quoteSend(userId: string, input: SendInput): Promise<SendQuote> {
  const problems: string[] = [];
  const base = { code: input.code, amount: input.amount };
  if (!StrKey.isValidEd25519PublicKey(input.to)) problems.push("That isn't a valid Stellar address (it starts with G and is 56 characters).");
  if (input.to === userId) problems.push("You can't send to yourself.");
  if (!(input.amount > 0)) problems.push("Enter an amount above zero.");

  const me = await StellarAccount.load(userId);
  if (!me) return { ...base, mode: null, lines: [], xlmCost: 0, balance: 0, ok: false, problems: ["Your wallet isn't active yet."] };
  const balance = isXlm(input) ? me.spendableXlm() : input.issuer ? me.tokenBalance(input.code, input.issuer) : 0;
  if (problems.length) return { ...base, mode: null, lines: [], xlmCost: 0, balance, ok: false, problems };

  const dest = await StellarAccount.load(input.to);
  let mode: SendMode;
  if (isXlm(input)) {
    mode = dest ? "payment" : "create";
    if (!dest && input.amount < MIN_NEW_ACCOUNT_XLM) problems.push(`This address isn't active yet — send at least ${MIN_NEW_ACCOUNT_XLM} XLM to open it.`);
  } else {
    mode = dest?.hasTrustline(input.code, input.issuer!) ? "payment" : "gift";
  }

  const reserve = mode === "gift" ? BASE_RESERVE_XLM : 0;
  const xlmCost = FEE_XLM + reserve;
  const lines: CostLine[] = [
    { key: "price", label: "Amount", amount: input.amount, currency: input.code, inTotal: true },
    { key: "networkFee", label: "Network fee", amount: FEE_XLM, currency: "XLM", inTotal: isXlm(input) },
  ];
  if (reserve) lines.push({ key: "reserve", label: "Gift reserve", amount: reserve, currency: "XLM", hint: "Held while the gift waits; returned to you when they accept it", inTotal: false });

  if (isXlm(input)) {
    if (input.amount + xlmCost > me.spendableXlm()) problems.push(`You have ${me.spendableXlm()} XLM available.`);
  } else {
    if (input.amount > balance) problems.push(`You have ${balance} ${input.code}.`);
    if (xlmCost > me.spendableXlm()) problems.push(`You need ${xlmCost} XLM available for the fee${reserve ? " and gift reserve" : ""}.`);
  }
  return { ...base, mode, lines, xlmCost, balance, ok: problems.length === 0, problems };
}

export async function prepareSend(ctx: Ctx, { userId, signer, ...input }: SendInput & { userId: string; signer: Signer }) {
  const q = await quoteSend(userId, input);
  if (!q.ok || !q.mode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: q.problems[0] ?? "This send can't go through." });

  const asset = isXlm(input) ? Asset.native() : new Asset(input.code, input.issuer!);
  const me = await StellarAccount.loadOrThrow(userId);
  const tx = new TransactionBuilder(me.raw, { fee: TrxBaseFee, networkPassphrase }).setTimeout(TX_TIMEOUT_SECONDS);
  if (q.mode === "create") tx.addOperation(Operation.createAccount({ destination: input.to, startingBalance: amt(input.amount) }));
  else if (q.mode === "gift")
    tx.addOperation(Operation.createClaimableBalance({ asset, amount: amt(input.amount), claimants: [new Claimant(input.to, Claimant.predicateUnconditional())] }));
  else tx.addOperation(Operation.payment({ destination: input.to, asset, amount: amt(input.amount) }));
  const built = tx.build();

  const [item, recipient] = await Promise.all([
    input.issuer ? ctx.db.asset.findFirst({ where: { code: input.code, issuer: input.issuer }, select: { id: true } }) : null,
    ctx.db.user.findUnique({ where: { id: input.to }, select: { id: true } }),
  ]);
  const row = await ctx.db.assetTransaction.create({
    data: {
      type: "TRANSFER",
      assetId: item?.id,
      buyerId: userId, // the sender
      sellerId: recipient?.id, // the recipient, when they're a Wadzzo user
      quantity: Math.max(1, Math.floor(input.amount)),
      currency: input.code,
      price: input.amount,
      total: input.amount,
      // fees are paid in XLM; recorded only when the amount itself is XLM, so `currency` stays true
      networkFee: isXlm(input) ? FEE_XLM : 0,
      txHash: built.hash().toString("hex"),
      expiresAt: new Date(Date.now() + TX_TIMEOUT_SECONDS * 1000),
      platformId: ctx.platform.id,
    },
  });
  return { txId: row.id, xdr: await signForUser(built.toXDR(), signer), mode: q.mode };
}
