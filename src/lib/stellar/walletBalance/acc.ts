import { Asset, BASE_FEE, Claimant,  Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { STELLAR_URL } from "./constant";

import { Horizon } from "@stellar/stellar-sdk";
import { StellarAccount } from "../marketplace/test/Account";

export type Balances = (
  | Horizon.HorizonApi.BalanceLineNative
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum4">
  | Horizon.HorizonApi.BalanceLineAsset<"credit_alphanum12">
  | Horizon.HorizonApi.BalanceLineLiquidityPool
)[];

interface PendingClaimableBalance {
  id: string;
  asset: string;
  amount: string;
  sponsor: string;
  claimants: Array<{
    destination: string;
    predicate:  unknown;
  }>;
  isExpired: boolean;
}
export async function NativeBalance ({ userPub }: { userPub: string }) {
  const server = new Horizon.Server(STELLAR_URL);

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
            else{
            return {
              ...balance,
              home_domain: null,
              asset_code: balance.asset_code,
              asset_issuer: balance.asset_issuer,
            }
          }
          }
          else{
            return {
              ...balance,
              home_domain: null,
              asset_code: balance.asset_code,
              asset_issuer: balance.asset_issuer,
            }
          }
        }
      else if(balance.asset_type==="native"){
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
  input,
}: {
  userPubKey: string;
  input: { recipientId: string; amount: number; asset_code: string; asset_type: string; asset_issuer: string };
}) {
  console.log('userPubKey', userPubKey);
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);

 const accBalance = account.balances.find((balance) => {
    if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === input.asset_code;
    } else if (balance.asset_type === 'native') {
      return balance.asset_type === input.asset_type;
    }
    return false;
  });
  console.log("accBalance",accBalance)
  if (!accBalance || parseFloat(accBalance.balance) < input.amount) {
    throw new Error("Balance is not enough to send the asset.");
  }
  const creatorStorageBal = await StellarAccount.create(input.recipientId);
  const hasTrust = creatorStorageBal.hasTrustline(input.asset_code, input.asset_type);
  const asset = input.asset_type === 'native'
    ? Asset.native()
    : new Asset(input.asset_code, input.asset_issuer);

  const soon = Math.ceil(Date.now() / 1000 + 60);
  const bCanClaim = Claimant.predicateBeforeRelativeTime('600'); // 600 seconds
  const aCanReclaim = Claimant.predicateNot(Claimant.predicateBeforeAbsoluteTime(soon.toString()));

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase: Networks.TESTNET,
  });

  if (!hasTrust && input.asset_type !== 'native') {
    const claimants: Claimant[] = [
      new Claimant(input.recipientId, bCanClaim),
      new Claimant(userPubKey, aCanReclaim),
    ];

    transaction.addOperation(
      Operation.createClaimableBalance({
        amount: input.amount.toString(),
        asset: asset,
        claimants: claimants,
      })
    );
  } else {
    transaction.addOperation(
      Operation.payment({
        destination: input.recipientId,
        asset: asset,
        amount: input.amount.toString(),
      })
    );
  }

  transaction.setTimeout(0);
  
  const buildTrx = transaction.build();
  const xdr = buildTrx.toXDR();
  console.log()
  return { xdr: xdr, pubKey: userPubKey, test: true };
 
}

export async function AddAssetTrustLine({
  userPubKey,
  input,
}: {
  userPubKey: string;
  input: { asset_code: string; asset_issuer: string };
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  if(input.asset_code.toUpperCase() === "XLM")
    {
      throw new Error("TrustLine can't be added on XML")
    }

 const findAsset = account.balances.find((balance) => {
    if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
      return balance.asset_code === input.asset_code && balance.asset_issuer === input.asset_issuer;
    } 
    return false;
  });

  if (findAsset) {
    throw new Error("TrustLine already exists.");
  }
  const asset = new Asset(input.asset_code, input.asset_issuer);
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
    .build();

  const xdr = transaction.toXDR();
  return { xdr: xdr, pubKey: userPubKey, test: true };
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
  return {
    items: items.records,
    nextCursor: items.records.length > 0 ? String(items.records[items?.records?.length - 1]?.paging_token) : null,
  };
}



export async function PendingAssetList({
  userPubKey,
}: {
  userPubKey: string;
}): Promise<PendingClaimableBalance[]> {
  const server = new Horizon.Server(STELLAR_URL);
  
  const pendingItems = await server.claimableBalances().claimant(userPubKey).call();

  const currentTime = Math.floor(Date.now() / 1000);

  const parsedItems = pendingItems.records.map((record) => {
    const isExpired = record?.claimants?.some((claimant) => {
      const absBefore = claimant?.predicate?.not?.abs_before;
      return absBefore ? currentTime >= new Date(absBefore).getTime() / 1000 : false;
    });

    return {
      id: record.id,
      asset: record.asset,
      amount: record.amount,
      sponsor: record.sponsor ?? '', // Ensure sponsor is always a string
      claimants: record.claimants,
      isExpired: !!isExpired,
    };
  });

  return parsedItems;
}


export async function AcceptClaimableBalance({
  userPubKey,
  input,
}: {
  userPubKey: string;
  input: { balanceId: string };
}) {
  console.log("BalanceId", input.balanceId)
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  try {
     const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.claimClaimableBalance({
        balanceId: input.balanceId,

      })
    )
    .setTimeout(0)
    .build();
     const xdr = transaction.toXDR();
  return { xdr: xdr, pubKey: userPubKey, test: true };

  } catch (error) {
    throw new Error("Error in accepting claimable balance");
    
  }

 
}


export async function DeclineClaimableBalance({
  userPubKey,
  input,
}: {
  userPubKey: string;
  input: { balanceId: string };
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);

      const transaction = new TransactionBuilder(account,{
      fee: '100', // Adjust fee as needed
      networkPassphrase: Networks.TESTNET, // Adjust for mainnet if necessary
    })
      .addOperation(
        Operation.clawbackClaimableBalance({
          balanceId: input.balanceId,
        })
      )
      .setTimeout(0)
      .build();
    const xdr = transaction.toXDR();
    return { xdr: xdr, pubKey: userPubKey, test: true };
}
