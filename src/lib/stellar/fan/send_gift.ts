import {
  Asset,
  Claimant,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { PLATFORM_ASSET, STELLAR_URL, TrxBaseFee, TrxBaseFeeInPlatformAsset, networkPassphrase } from "../constant";
import { MyAssetType } from "./utils";
import { SignUserType, WithSing } from "../utils";
import { StellarAccount } from "../marketplace/test/Account";
import { getplatformAssetNumberForXLM } from "./get_token_price";

const log = console;

export async function sendGift({
  customerPubkey,
  creatorPageAsset,
  creatorPub,
  price,
  creatorStorageSec,
  signWith,
}: {
  customerPubkey: string;
  creatorPageAsset: MyAssetType;
  price: number;
  creatorPub: string;
  creatorStorageSec: string;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);
  const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);
  const assetStorage = Keypair.fromSecret(creatorStorageSec);

  const transactionInializer = await server.loadAccount(motherAccount.publicKey());
  console.log("Secrate", creatorStorageSec)
  console.log("Storage", assetStorage)
  const tokens = (await StellarAccount.create(assetStorage.publicKey())).getTokenBalance(creatorPageAsset.code, creatorPageAsset.issuer);
  const accountDetails = await server.loadAccount(assetStorage.publicKey());
  console.log("Balances:", accountDetails.balances);

  console.log("Tokens", tokens, price)
  if (!tokens) {
    throw new Error("Asset not found");
  }
  if (Number(tokens) < price) {
    throw new Error("Not enough balance");
  }

  const extraCost = await getplatformAssetNumberForXLM(1);

  const transactionFee = Number(TrxBaseFee) + Number(TrxBaseFeeInPlatformAsset) + extraCost;

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
  Tx1.addOperation(
    Operation.payment({
      asset: PLATFORM_ASSET,
      amount: transactionFee.toFixed(7),
      source: creatorPub,
      destination: motherAccount.publicKey(),
    }),
  )
  if (creatorPageAsset.code !== PLATFORM_ASSET.code && creatorPageAsset.issuer !== PLATFORM_ASSET.issuer) {
    const checkReciverHasTrust = (await StellarAccount.create(customerPubkey)).hasTrustline(creatorPageAsset.code, creatorPageAsset.issuer);
    if (!checkReciverHasTrust) {
      const claimants: Claimant[] = [
        new Claimant(customerPubkey, Claimant.predicateUnconditional(),
        ),
      ];

      Tx1.addOperation(
        Operation.payment({
          asset: Asset.native(),
          amount: "1",
          destination: assetStorage.publicKey(),
          source: motherAccount.publicKey(),
        })
      );
      Tx1.addOperation(
        Operation.createClaimableBalance({
          amount: price.toFixed(7),
          asset,
          source: assetStorage.publicKey(),
          claimants: claimants,
        })
      )

      Tx1.setTimeout(0);
      const buildTrx = Tx1.build();
      buildTrx.sign(assetStorage, motherAccount);
      const xdr = buildTrx.toXDR();
      const singedXdr = WithSing({ xdr, signWith });
      return singedXdr;
    }
    else {
      Tx1.addOperation(
        Operation.payment({
          asset,
          amount: price.toFixed(7),
          source: assetStorage.publicKey(),
          destination: customerPubkey,
        }),
      )
    }
    Tx1.setTimeout(0);
    const buildTrx = Tx1.build();
    buildTrx.sign(motherAccount, assetStorage);
    const xdr = buildTrx.toXDR();
    const singedXdr = WithSing({ xdr, signWith });
    return singedXdr;
  }



}


export const sendGitfAsPlatformAsset = async ({
  reciver,
  creatorId,
  amount,
  assetCode,
  assetIssuer,
  signWith,
}: {
  reciver: string,
  creatorId: string,
  amount: number,
  assetCode: string,
  assetIssuer: string,
  signWith: SignUserType,
}) => {
  const server = new Horizon.Server(STELLAR_URL);
  const asset = new Asset(assetCode, assetIssuer);
  const transactionInializer = await server.loadAccount(creatorId);
  const receiverAcc = await StellarAccount.create(reciver);
  const senderAdcc = await StellarAccount.create(creatorId);
  const token = senderAdcc.getTokenBalance(assetCode, assetIssuer);
  if (!token) {
    throw new Error("Asset not found");
  }
  if (Number(token) < amount) {
    throw new Error("Not enough balance");
  }
  const hasReciverTrust = receiverAcc.hasTrustline(assetCode, assetIssuer);
  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })
  if (!hasReciverTrust) {
    throw new Error("Reciver has no trustline")
  }
  Tx1.addOperation(
    Operation.payment({
      asset,
      amount: amount.toFixed(7),
      source: creatorId,
      destination: reciver,
    }),
  )
  Tx1.setTimeout(0);
  const buildTrx = Tx1.build();
  buildTrx.sign();
  const xdr = buildTrx.toXDR();
  const singedXdr = WithSing({ xdr, signWith });
  return singedXdr;

}