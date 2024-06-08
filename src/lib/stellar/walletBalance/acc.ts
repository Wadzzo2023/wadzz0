import { Asset, BASE_FEE, Claimant, Keypair, Memo, Networks, Operation, Server, TransactionBuilder } from "stellar-sdk";
import { STELLAR_URL } from "./constant";

import { type Horizon } from "stellar-sdk";
import { StellarAccount } from "../marketplace/test/Account";
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
  const server = new Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);

  const accBalance = account.balances.find(
    (balance) => 
      balance.asset_code === input.asset_code
  );
  if(accBalance?.balance < input.amount){
    throw new Error("Balance is not enough to send the asset.");
  }
  const creatorStorageBal = await StellarAccount.create(input.recipientId);
  const hasTrust = creatorStorageBal.hasTrustline(input.asset_code, input.asset_type);
  const asset = input.asset_type === 'native'
    ? Asset.native()
    : new Asset(input.asset_code, input.asset_issuer);

  const soon = Math.ceil(Date.now() / 1000 + 60);
  const bCanClaim = Claimant.predicateBeforeRelativeTime('60');
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
  return { xdr: xdr, pubKey: userPubKey, test: true };
}