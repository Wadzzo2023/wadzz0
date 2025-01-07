/* eslint-disable */

import {
  Asset,
  BASE_FEE,
  Claimant,
  Keypair,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import { Horizon } from "@stellar/stellar-sdk";
import { StellarAccount } from "../marketplace/test/Account";
import { SignUserType, WithSing } from "../utils";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import {
  networkPassphrase,
  PLATFORM_ASSET,
  STELLAR_URL,
  TrxBaseFee,
} from "../constant";
import { api } from "~/utils/api";
import { db } from "~/server/db";

export type Balances = (
  | Horizon.HorizonApi.BalanceLineNative
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum4">
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum12">
  | Horizon.HorizonApi.BalanceLineLiquidityPool
)[];
export type ParsedTransaction = {
  type?: string;
  amount?: string;
  asset?: string;
  destination?: string;
  source?: string;
  startingBalance?: string;
  claimants?: unknown[];
  issuer?: string;
  createdAt?: string;
  balanceId?: string;
  code?: string;
};
interface Predicate {
  and?: Predicate[];
  or?: Predicate[];
  not?: Predicate;
  abs_before?: string;
  rel_before?: string;
}
interface PendingClaimableBalance {
  id: string;
  asset: string;
  amount: string;
  sponsor: string;
  claimants: Array<{
    destination: string;
    predicate: Predicate;
  }>;
}
export async function NativeBalance({ userPub }: { userPub: string }) {
  const server = new Horizon.Server(STELLAR_URL);

  const account = await server.loadAccount(userPub);

  const nativeBalance = account.balances.find((balance) => {
    if (balance.asset_type === "native") {
      return balance;
    }
  });

  return nativeBalance;
}

export async function BalanceWithHomeDomain({ userPub }: { userPub: string }) {
  const server = new Horizon.Server(STELLAR_URL);

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
              amount: balance.balance < "0.0000001" ? "0" : balance.balance,
              home_domain: issuerAccount.home_domain,
              asset_code: balance.asset_code,
              asset_issuer: balance.asset_issuer,
            };
          } else {
            return {
              ...balance,
              amount: balance.balance < "0.0000001" ? "0" : balance.balance,
              home_domain: null,
              asset_code: balance.asset_code,
              asset_issuer: balance.asset_issuer,
            };
          }
        } else {
          return {
            ...balance,
            home_domain: null,
            amount: balance.balance < "0.0000001" ? "0" : balance.balance,
            asset_code: balance.asset_code,
            asset_issuer: balance.asset_issuer,
          };
        }
      } else if (balance.asset_type === "native") {
        return {
          ...balance,
          home_domain: null,
          amount: balance.balance < "0.0000001" ? "0" : balance.balance,
          asset_code: "XLM",
          asset_issuer: "native",
        };
      }
    }),
  );
  // console.log(balances);
  return balances;
}

export async function SendAssets({
  userPubKey,
  recipientId,
  amount,
  asset_code,
  asset_type,
  asset_issuer,
  signWith,
  secretKey,
}: {
  userPubKey: string;

  recipientId: string;
  amount: number;
  asset_code: string;
  asset_type: string;
  asset_issuer: string;
  signWith: SignUserType;
  secretKey?: string | undefined;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);

  if (userPubKey === recipientId) {
    throw new Error("You can't send asset to yourself");
  }
  const accBalance = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return balance.asset_code === asset_code && balance.asset_issuer === asset_issuer;
    } else if (balance.asset_type === "native") {
      return balance.asset_type === asset_type;
    }
    return false;
  });

  if (!accBalance || parseFloat(accBalance.balance) < amount) {
    throw new Error("Balance is not enough to send the asset.");
  }

  const receiverAccount = await server.loadAccount(recipientId);
  const hasTrust = receiverAccount.balances.some((balance) => {

    return (
      (balance.asset_type === "credit_alphanum4" || balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === asset_code &&
      balance.asset_issuer === asset_issuer
    );
  });

  const asset =
    asset_type === "native"
      ? Asset.native()
      : new Asset(asset_code, asset_issuer);

  const transaction = new TransactionBuilder(account, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  if (!hasTrust && asset_type !== "native") {
    const claimants: Claimant[] = [
      new Claimant(recipientId, Claimant.predicateUnconditional()),
    ];

    transaction.addOperation(
      Operation.createClaimableBalance({
        amount: amount.toString(),
        asset: asset,
        claimants: claimants,
      }),
    );
  } else {
    transaction.addOperation(
      Operation.payment({
        destination: recipientId,
        asset: asset,
        amount: amount.toString(),
        source: userPubKey,
      }),
    );
  }

  transaction.setTimeout(0);

  const buildTrx = transaction.build();

  if (signWith && "email" in signWith && secretKey) {
    const xdr = buildTrx.toXDR();
    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith,
    });
    return { xdr: signedXDr, pubKey: userPubKey };
  }
  return { xdr: buildTrx.toXDR(), pubKey: userPubKey };
}

export async function AddAssetTrustLine({
  userPubKey,
  asset_code,
  asset_issuer,
  signWith,
  secretKey,
}: {
  userPubKey: string;
  asset_code: string;
  asset_issuer: string;
  signWith: SignUserType;
  secretKey?: string | undefined;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  if (asset_code.toUpperCase() === "XLM") {
    throw new Error("TrustLine can't be added on XML");
  }

  const findAsset = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return (
        balance.asset_code === asset_code &&
        balance.asset_issuer === asset_issuer
      );
    }
    return false;
  });

  if (findAsset) {
    throw new Error("TrustLine already exists.");
  }
  const asset = new Asset(asset_code, asset_issuer);
  const transaction = new TransactionBuilder(account, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: asset,
      }),
    )
    .setTimeout(0);
  const buildTrx = transaction.build();
  if (signWith && "email" in signWith && secretKey) {
    const xdr = buildTrx.toXDR();

    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith,
    });
    return { xdr: signedXDr, pubKey: userPubKey };
  }

  return { xdr: buildTrx.toXDR(), pubKey: userPubKey };
}

export async function RecentTransactionHistory({
  userPubKey,
  input,
}: {
  userPubKey: string;
  input: {
    limit?: number | null;
    cursor?: string | null;
  };
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const limit = input.limit ?? 10;
  const cursor = input.cursor ?? undefined;

  let transactionCall = server
    .transactions()
    .forAccount(userPubKey)
    .limit(limit)
    .order("desc");

  if (cursor) {
    transactionCall = transactionCall.cursor(cursor);
  }

  const items = await transactionCall.call();

  if (!items.records) {
    return {
      items: [],
      nextCursor: null,
    };
  }

  // creating set of string pubkey
  const PubKey: Set<string> = new Set();

  const newItems = await Promise.all(
    items.records.map(async (record: Horizon.ServerApi.TransactionRecord) => {
      const ops = await record.operations();
      ops.records.forEach((op) => {
        if (op.type === "payment" || op.type === "path_payment_strict_receive" || op.type === "path_payment_strict_send") {
          op.from = op.from ?? record.source_account;
          op.to = op.to ?? record.source_account;
          PubKey.add(op.from);
          PubKey.add(op.to);
        }
        else {
          PubKey.add(op.source_account);
        }
      });

      const users = await db.user.findMany({
        where: {
          id: {
            in: Array.from(PubKey),
          },

        },
      });

      const creators = await db.creator.findMany({
        where: {
          storagePub: {
            in: Array.from(PubKey),
          },
        },
      });


      return {
        source: record.source_account,
        sequence: record.source_account_sequence,
        ledger_attr: record.ledger_attr,
        successful: record.successful,
        createdAt: record.created_at,
        maxFee: record.max_fee,
        memo: record.memo,
        id: record.id,
        signatures: record.signatures,
        pagingToken: record.paging_token,
        envelopeXdr: record.envelope_xdr,
        resultXdr: record.result_xdr,
        resultMetaXdr: record.result_meta_xdr,
        fee_charged: record.fee_charged,

        operations: ops.records.map((op) => {
          if (op.type === 'payment' || op.type === 'path_payment_strict_receive' || op.type === 'path_payment_strict_send') {

            let userFrom = users.find((user) => user.id === op.from);
            let creatorFrom = creators.find((creator) => creator.storagePub === op.from);
            let userTo = users.find((user) => user.id === op.to);
            let creatorTo = creators.find((creator) => creator.storagePub === op.to);
            return {
              ...op,
              from:
                userFrom?.name
                  ? `${userFrom.name} :: ${op.from}`
                  : creatorFrom?.name
                    ? `${creatorFrom.name}'s storage :: ${op.from}`
                    : op.from,
              to:
                userTo?.name
                  ? `${userTo.name} :: ${op.to}`
                  : creatorTo?.name
                    ? `${creatorTo.name}'s storage :: ${op.to}`
                    : op.to,
            };
          }
          return {
            ...op,
            source_account: users.find((user) => user.id === op.source_account)?.name ? `${users.find((user) => user.id === op.source_account)?.name} :: ${op.source_account}` : creators.find((creator) => creator.storagePub === op.source_account)?.name ? `${creators.find((creator) => creator.storagePub === op.source_account)?.name} :: ${op.source_account}` : op.source_account

          };
        })
      };
    })
  );

  return {
    items: newItems,
    nextCursor: items.records.length > 0 ? items.records[items.records.length - 1]?.paging_token : null,
  };
}


export async function PendingAssetList({
  userPubKey,
}: {
  userPubKey: string;
}): Promise<PendingClaimableBalance[]> {
  const server = new Horizon.Server(STELLAR_URL);

  const pendingItems = await server
    .claimableBalances()
    .claimant(userPubKey)
    .limit(20)
    .order("desc")
    .call();

  const parsedItems = pendingItems.records.map((record) => {
    return {
      id: record.id,
      asset: record.asset,
      amount: record.amount,
      sponsor: record.sponsor ?? "",
      claimants: record.claimants,
    };
  });

  return parsedItems;
}

export async function AcceptClaimableBalance({
  userPubKey,
  balanceId,
  signWith,
  secretKey,
}: {
  userPubKey: string;
  balanceId: string;
  signWith: SignUserType;
  secretKey?: string | undefined;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  try {
    const transaction = new TransactionBuilder(account, {
      fee: TrxBaseFee,
      networkPassphrase,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId: balanceId,
        }),
      )
      .setTimeout(0);
    const buildTrx = transaction.build();

    if (signWith && "email" in signWith && secretKey) {
      // console.log("Calling...");
      const xdr = buildTrx.toXDR();
      const signedXDr = await WithSing({
        xdr: xdr,
        signWith: signWith,
      });
      return { xdr: signedXDr, pubKey: userPubKey };
    }

    return { xdr: buildTrx.toXDR(), pubKey: userPubKey };
  } catch (error) {
    throw new Error("Error in accepting claimable balance");
  }
}

export async function DeclineClaimableBalance({
  pubKey,
  balanceId,
  signWith,
  secretKey,
}: {
  pubKey: string;
  balanceId: string;
  signWith: SignUserType;
  secretKey?: string | undefined;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(pubKey);

  const transaction = new TransactionBuilder(account, {
    fee: TrxBaseFee, // Adjust fee as needed
    networkPassphrase, // Adjust for mainnet if necessary
  })
    .addOperation(
      Operation.clawbackClaimableBalance({
        balanceId: balanceId,
      }),
    )
    .setTimeout(0);
  const buildTrx = transaction.build();

  if (signWith && "email" in signWith && secretKey) {
    const xdr = buildTrx.toXDR();
    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith,
    });
    return { xdr: signedXDr, pubKey: pubKey };
  }
  return { xdr: buildTrx.toXDR(), pubKey: pubKey };
}
export async function CheckHasTrustLineOnPlatformAsset({
  userPubKey,
}: {
  userPubKey: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const account = await server.loadAccount(userPubKey);
  const findAsset = account.balances.some((balance) => {

    if (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === PLATFORM_ASSET.code &&
      balance.asset_issuer === PLATFORM_ASSET.issuer
    ) {
      return true;
    }
    return false;
  });

  return findAsset;
}

export async function PlatformAssetBalance({
  userPubKey,
}: {
  userPubKey: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  try {
    const account = await server.loadAccount(userPubKey);
    const findAsset = account.balances.find((balance) => {
      if (
        (balance.asset_type === "credit_alphanum4" ||
          balance.asset_type === "credit_alphanum12") &&
        balance.asset_code === PLATFORM_ASSET.code &&
        balance.asset_issuer === PLATFORM_ASSET.issuer
      ) {
        return balance.balance;
      }
      return false;
    });
    return findAsset ? findAsset.balance : 0;
  } catch (e) {
    return -1
  }
}
