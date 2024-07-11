import { Asset, BASE_FEE, Claimant, Keypair, Networks, Operation, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import { PLATFROM_ASSET, STELLAR_URL } from "./constant";

import { Horizon } from "@stellar/stellar-sdk";
import { StellarAccount } from "../marketplace/test/Account";
import { SignUserType, WithSing } from "../utils";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";

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
    predicate: Predicate
  }>;

}
export async function NativeBalance({ userPub }: { userPub: string }) {
  const server = new Horizon.Server(STELLAR_URL);

  const account = await server.loadAccount(userPub);

  const nativeBalance = account.balances.find(
    (balance) => {
      if (balance.asset_type === 'native') {
        return balance
      }
    }
  );

  return nativeBalance;
}


export async function BalanceWithHomeDomain({
  userPub,
}: {
  userPub: string;
}) {
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
            }

          }
          else {
            return {
              ...balance,
              amount: balance.balance < "0.0000001" ? "0" : balance.balance,
              home_domain: null,
              asset_code: balance.asset_code,
              asset_issuer: balance.asset_issuer,
            }
          }
        }
        else {
          return {
            ...balance,
            home_domain: null,
            amount: balance.balance < "0.0000001" ? "0" : balance.balance,
            asset_code: balance.asset_code,
            asset_issuer: balance.asset_issuer,
          }
        }
      }
      else if (balance.asset_type === "native") {
        return {
          ...balance,
          home_domain: null,
          amount: balance.balance < "0.0000001" ? "0" : balance.balance,
          asset_code: "XLM",
          asset_issuer: "native",

        }
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
  secretKey?: string | undefined
}) {

  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);

  if (userPubKey === recipientId) {
    throw new Error("You can't send asset to yourself");
  }
  const accBalance = account.balances.find((balance) => {
    if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === asset_code;
    } else if (balance.asset_type === 'native') {
      return balance.asset_type === asset_type;
    }
    return false;
  });
  // console.log('accBalance', accBalance);
  if (!accBalance || parseFloat(accBalance.balance) < amount) {
    throw new Error('Balance is not enough to send the asset.');
  }

  const receiverAccount = await server.loadAccount(recipientId);
  const hasTrust = receiverAccount.balances.find((balance) => {
    if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === asset_code && balance.asset_issuer === asset_issuer;
    }
    else if (balance.asset_type === 'native') {
      return balance.asset_type === asset_type;
    }
    return false;
  });

  const asset = asset_type === 'native' ? Asset.native() : new Asset(asset_code, asset_issuer);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase: Networks.TESTNET,
  });

  if (!hasTrust && asset_type !== 'native') {
    const claimants: Claimant[] = [
      new Claimant(recipientId, Claimant.predicateUnconditional()),

    ];

    transaction.addOperation(
      Operation.createClaimableBalance({
        amount: amount.toString(),
        asset: asset,
        claimants: claimants,
      })
    );
  } else {
    transaction.addOperation(
      Operation.payment({
        destination: recipientId,
        asset: asset,
        amount: amount.toString(),
      })
    );
  }

  transaction.setTimeout(0);

  const buildTrx = transaction.build();

  if (signWith && 'email' in signWith && secretKey) {
    const xdr = buildTrx.toXDR();
    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith
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
  secretKey
}: {
  userPubKey: string;
  asset_code: string;
  asset_issuer: string;
  signWith: SignUserType;
  secretKey?: string | undefined
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  if (asset_code.toUpperCase() === "XLM") {
    throw new Error("TrustLine can't be added on XML")
  }

  const findAsset = account.balances.find((balance) => {
    if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === asset_code && balance.asset_issuer === asset_issuer;
    }
    return false;
  });

  if (findAsset) {
    throw new Error("TrustLine already exists.");
  }
  const asset = new Asset(asset_code, asset_issuer);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: asset
      })
    )
    .setTimeout(0)
  const buildTrx = transaction.build();
  if (signWith && 'email' in signWith && secretKey) {
    const xdr = buildTrx.toXDR();

    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith
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
  input: { limit: number | null | undefined; cursor: string | null | undefined };
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const limit = input.limit ?? 10;
  const cursor = input.cursor ?? "";

  let transactionCall = server.transactions().forAccount(userPubKey).limit(limit).order("desc");

  if (cursor) {
    transactionCall = transactionCall.cursor(cursor);
  }

  const items = await transactionCall.call();

  const newItem = items.records.map((record) => {
    const tx = new Transaction(record.envelope_xdr, Networks.TESTNET);
    const operations = tx.operations;
    // console.log("Operations", operations);
    if (operations[0]?.type === "payment") {
      return {
        ...record,
        parseDetails: {
          type: "payment",
          amount: operations[0].amount,
          asset: operations[0].asset.code,
          issuer: operations[0].asset.issuer,
          destination: operations[0].destination,
          source: userPubKey,
          createdAt: record.created_at,
        },
      };
    } else if (operations[0]?.type === "createAccount") {
      return {
        ...record,
        parseDetails: {
          type: "createAccount",
          startingBalance: operations[0].startingBalance,
          source: userPubKey,
          createdAt: record.created_at,
        },
      };
    } else if (operations[0]?.type === "createClaimableBalance") {
      return {
        ...record,
        parseDetails: {
          type: "createClaimableBalance",
          amount: operations[0].amount,
          code: operations[0].asset.code,
          issuer: operations[0].asset.issuer,

          claimantZero: operations[0].claimants[0]?.destination,
          claimantOne: operations[0].claimants[1]?.destination,
          createdAt: record.created_at,
        },
      };
    } else if (operations[0]?.type === "claimClaimableBalance") {
      return {
        ...record,
        parseDetails: {
          type: "claimClaimableBalance",
          balanceId: operations[0].balanceId,

          source: userPubKey,
          createdAt: record.created_at,
        },
      };
    }
    else if (operations[0]?.type === "changeTrust") {
      return {
        ...record,
        parseDetails: {
          type: "changeTrust",
          //  asset: operations[0]?.asset?.code,

          source: userPubKey,
          createdAt: record.created_at,
        },
      };
    }
  });

  return {
    items: newItem,
    nextCursor: items.records.length > 0 ? String(items.records[items.records.length - 1]?.paging_token) : null,
  };
}


export async function PendingAssetList({
  userPubKey,
}: {
  userPubKey: string;
}): Promise<PendingClaimableBalance[]> {
  const server = new Horizon.Server(STELLAR_URL);

  const pendingItems = await server.claimableBalances().claimant(userPubKey).limit(20).order("desc").call();
  console.log("Pending", pendingItems.records);

  const parsedItems = pendingItems.records.map((record) => {
    return {
      id: record.id,
      asset: record.asset,
      amount: record.amount,
      sponsor: record.sponsor ?? '',
      claimants: record.claimants,
    }
  });

  return parsedItems;
}

export async function AcceptClaimableBalance({
  userPubKey,
  balanceId,
  signWith,
  secretKey
}: {
  userPubKey: string;
  balanceId: string;
  signWith: SignUserType;
  secretKey?: string | undefined
}) {
  // console.log("BalanceId", balanceId)
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  try {
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE.toString(),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId: balanceId,

        })
      )
      .setTimeout(0)
    const buildTrx = transaction.build();

    if (signWith && "email" in signWith && secretKey) {
      // console.log("Calling...");
      const xdr = buildTrx.toXDR();
      const signedXDr = await WithSing({
        xdr: xdr,
        signWith: signWith
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
  secretKey
}: {
  pubKey: string;
  balanceId: string;
  signWith: SignUserType;
  secretKey?: string | undefined
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(pubKey);

  const transaction = new TransactionBuilder(account, {
    fee: '100', // Adjust fee as needed
    networkPassphrase: Networks.TESTNET, // Adjust for mainnet if necessary
  })
    .addOperation(
      Operation.clawbackClaimableBalance({
        balanceId: balanceId,
      })
    )
    .setTimeout(0)
  const buildTrx = transaction.build();

  if (signWith && "email" in signWith && secretKey) {

    const xdr = buildTrx.toXDR();
    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith
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
  const findAsset = account.balances.find((balance) => {
    if (
      (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') &&
      balance.asset_code === PLATFROM_ASSET.code &&
      balance.asset_issuer === PLATFROM_ASSET.issuer
    ) {
      return true;
    }
    return false;
  });

  return !!findAsset;
}


export async function PlatformAssetBalance({
  userPubKey,
}: {
  userPubKey: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  const findAsset = account.balances.find((balance) => {
    if (
      (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') &&
      balance.asset_code === PLATFROM_ASSET.code &&
      balance.asset_issuer === PLATFROM_ASSET.issuer
    ) {
      return balance.balance;
    }
    return false;
  });

  return findAsset ? findAsset.balance : 0;
}

