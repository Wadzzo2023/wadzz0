import {
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
  Asset,
} from "@stellar/stellar-sdk";
import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "./fan/constant";
import { env } from "~/env";
import { AccountSchema, AccountType } from "./fan/utils";
import { SignUserType, WithSing } from "./utils";
import { getplatformAssetNumberForXLM } from "./fan/get_token_price";

const log = console;

// transection variables

export async function createUniAsset({
  pubkey,
  code,
  limit,
  signWith,
  homeDomain,
  storageSecret,
  ipfsHash,
}: {
  pubkey: string;
  code: string;
  limit: string;
  actionAmount: string;
  storageSecret: string;
  signWith: SignUserType;
  homeDomain: string;
  ipfsHash: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  // accounts
  const issuerAcc = Keypair.random();
  const asesetStorage = Keypair.fromSecret(storageSecret);
  const PLATFORM_MOTHER_ACC = Keypair.fromSecret(env.MOTHER_SECRET);

  const asset = new Asset(code, issuerAcc.publicKey());

  // get total platform token
  const requiredAsset2refundXlm = await getplatformAssetNumberForXLM(2.5);
  const totalAction = requiredAsset2refundXlm + Number(PLATFROM_FEE);

  // here pubkey should be change for admin
  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  });

  // is admin is creating the trx
  console.log(signWith, "signWith");
  if (signWith === undefined || (signWith && !("isAdmin" in signWith))) {
    // first get action for required xlm. and platformFee
    console.log("vong");
    Tx1.addOperation(
      Operation.payment({
        destination: PLATFORM_MOTHER_ACC.publicKey(),
        asset: PLATFROM_ASSET,
        amount: totalAction.toString(),
      }),
    )

      // send this required xlm to storage so that it can lock new  trusting asset (0.5xlm)
      .addOperation(
        Operation.payment({
          destination: asesetStorage.publicKey(),
          asset: Asset.native(),
          amount: "0.5",
          source: PLATFORM_MOTHER_ACC.publicKey(),
        }),
      )
      // send this required xlm to creator puby so that it can lock new  trusting asset (0.5xlm)
      .addOperation(
        Operation.payment({
          destination: pubkey,
          asset: Asset.native(),
          amount: "2",
          source: PLATFORM_MOTHER_ACC.publicKey(),
        }),
      );
  }

  // create issuer account
  Tx1.addOperation(
    Operation.createAccount({
      destination: issuerAcc.publicKey(),
      startingBalance: "1.5",
      // source: PLATFORM_MOTHER_ACC.publicKey(),
    }),
  )
    //
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: limit,
      }),
    )
    // 2
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: limit,
        source: asesetStorage.publicKey(),
      }),
    )

    // 3
    .addOperation(
      Operation.payment({
        asset,
        amount: limit,
        source: issuerAcc.publicKey(),
        destination: asesetStorage.publicKey(),
      }),
    )
    // 4
    .addOperation(
      Operation.setOptions({
        homeDomain,
        source: issuerAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "ipfshash",
        value: ipfsHash,
        source: issuerAcc.publicKey(),
      }),
    )

    .setTimeout(0);

  const buildTrx = Tx1.build();

  // sign
  buildTrx.sign(PLATFORM_MOTHER_ACC, issuerAcc, asesetStorage);
  const xdr = buildTrx.toXDR();

  const signedXDr = await WithSing({
    xdr: xdr,
    signWith: signWith && "isAdmin" in signWith ? undefined : signWith,
  });

  const issuer: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };

  return { xdr: signedXDr, issuer };
}
