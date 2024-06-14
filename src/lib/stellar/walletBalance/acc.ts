import { Asset, BASE_FEE, Claimant, Keypair, Networks, Operation, Transaction, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { STELLAR_URL } from "./constant";
import { Horizon } from "@stellar/stellar-sdk";

import {  type SignUserType, WithSing } from "../utils";


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

interface PendingClaimableBalance {
  id: string;
  asset: string;
  amount: string;

  claimants: Horizon.HorizonApi.Claimant[];
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
              home_domain: issuerAccount.home_domain,
              asset_code: balance.asset_code,
              asset_issuer: balance.asset_issuer,
            }

          }
          else {
            return {
              ...balance,
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
            asset_code: balance.asset_code,
            asset_issuer: balance.asset_issuer,
          }
        }
      }
      else if (balance.asset_type === "native") {
        return {
          ...balance,
          home_domain: null,
          asset_code: "XLM",
          asset_issuer: "native",

        }
      }
    }),
  );
  console.log(balances);
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

  // Load sender's account
  const account = await server.loadAccount(userPubKey);

  // Check sender's balance
  const accBalance = account.balances.find((balance) => {
    if (balance.asset_type === 'native') {
      return balance.asset_type === asset_type;
    } else if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === asset_code;
    }
    return false;
  });

  if (!accBalance || parseFloat(accBalance.balance) < amount) {
    throw new Error('Balance is not enough to send the asset.');
  }

  // Load recipient's account to check trustline
  const receiverAccount = await server.loadAccount(recipientId);
  const hasTrust = receiverAccount.balances.find((balance) => {
    if (balance.asset_type === 'native') {
      return balance.asset_type === asset_type;
    } else if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === asset_code && balance.asset_issuer === asset_issuer;
    }
    return false;
  });

  // Define the asset
  const asset = asset_type === 'native' ? Asset.native() : new Asset(asset_code, asset_issuer);

  // Prepare claimants and predicate for claimable balance
  const pred : xdr.ClaimPredicate = Claimant.predicateUnconditional();
  const claimants: Claimant[] = [
    new Claimant(recipientId, pred),
    new Claimant(userPubKey, pred),
   
  ];

  // Build transaction
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase: Networks.TESTNET,
  });

  // Add operation based on whether recipient has trustline
  if (!hasTrust && asset_type !== 'native') {
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

  // Sign and return transaction XDR
  const buildTrx = transaction.build();

  if (signWith && 'email' in signWith && secretKey) {
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
    return { xdr: signedXDr, pubKey: userPubKey};
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
    console.log("Operations", operations);
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
          // asset: operations[0].asset.code,
          // issuer: operations[0].asset.issuer,
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

  const pendingItems = await server.claimableBalances().claimant(userPubKey).call();
  console.log("Pending", pendingItems.records);

  const record = pendingItems.records.filter((item) => {
    let claimantOne 
    let claimantTwo
    item.claimants.filter((claimant) => {
      if (claimant.destination === userPubKey) {
        claimantOne = claimant.destination
      }
      else {
        claimantTwo = claimant.destination
      }
    }
    )
    return claimantOne && claimantTwo
  }).map((item) => {
    return {
      id: item.id,
      asset: item.asset,
      amount: item.amount,
      claimants: item.claimants,
    };
  });
  return record
}

export async function AcceptClaimableBalance({
  userPubKey,
  balanceId,
  signWith,
  secretKey
}: {
  userPubKey: string;
  balanceId: string;
  signWith: SignUserType ;
  secretKey?: string | undefined
}) {
  console.log("BalanceId", balanceId)
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
      console.log("Calling...");
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
  secretKey? : string | undefined
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

  if (signWith&& "email" in signWith && secretKey) {

    const xdr = buildTrx.toXDR();
    const signedXDr = await WithSing({
      xdr: xdr,
      signWith: signWith
    });
    return { xdr: signedXDr, pubKey: pubKey };
  }
  return { xdr: buildTrx.toXDR(), pubKey: pubKey };
}


