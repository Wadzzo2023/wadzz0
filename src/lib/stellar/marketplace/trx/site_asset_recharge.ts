import {
  Asset,
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { MOTHER_SECRET, STORAGE_SECRET } from "../SECRET";
import { STELLAR_URL, PLATFORM_ASSET, networkPassphrase, TrxBaseFee } from "../../constant";
import { getAccSecretFromRubyApi } from "package/connect_wallet/src/lib/stellar/get-acc-secret";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";

export const ACCOUNT_ACTIVATION_RESERVE_XLM = "2.5";

export async function isStellarAccountActivated(pubKey: string): Promise<boolean> {
  try {
    const server = new Horizon.Server(STELLAR_URL);
    await server.loadAccount(pubKey);
    return true;
  } catch {
    return false;
  }
}

export async function checkTrustline(
  pubKey: string,
  code: string,
  issuer: string,
): Promise<boolean> {
  try {
    const server = new Horizon.Server(STELLAR_URL);
    const acc = await server.loadAccount(pubKey);
    return acc.balances.some((b) => {
      if (
        b.asset_type === "credit_alphanum4" ||
        b.asset_type === "credit_alphanum12"
      ) {
        return (
          b.asset_code === code &&
          b.asset_issuer === issuer &&
          Boolean(b.is_authorized)
        );
      }
      return false;
    });
  } catch {
    return false;
  }
}

export async function getAssetBalance(
  pubKey: string,
  code: string,
  issuer: string,
): Promise<number> {
  try {
    const server = new Horizon.Server(STELLAR_URL);
    const acc = await server.loadAccount(pubKey);
    const bal = acc.balances.find((b) => {
      if (
        b.asset_type === "credit_alphanum4" ||
        b.asset_type === "credit_alphanum12"
      ) {
        return b.asset_code === code && b.asset_issuer === issuer;
      }
      return false;
    });
    return bal ? parseFloat(bal.balance) : 0;
  } catch {
    return 0;
  }
}

export async function ensureBuyerActivatedAndTrusted({
  buyerPubKey,
  buyerSecret,
}: {
  buyerPubKey: string;
  buyerSecret: string;
}): Promise<{ activated: boolean; trustlineEstablished: boolean }> {
  const alreadyActive = await isStellarAccountActivated(buyerPubKey);
  const alreadyTrusted =
    alreadyActive &&
    (await checkTrustline(buyerPubKey, PLATFORM_ASSET.code, PLATFORM_ASSET.issuer));
  if (alreadyActive && alreadyTrusted) {
    return { activated: false, trustlineEstablished: false };
  }

  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const buyerKeypair = Keypair.fromSecret(buyerSecret);

  const motherAccount = await server.loadAccount(motherAcc.publicKey());
  const builder = new TransactionBuilder(motherAccount, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  if (!alreadyActive) {
    builder.addOperation(
      Operation.createAccount({
        destination: buyerPubKey,
        startingBalance: ACCOUNT_ACTIVATION_RESERVE_XLM,
        source: motherAcc.publicKey(),
      }),
    );
  } else {
    builder.addOperation(
      Operation.payment({
        destination: buyerPubKey,
        amount: "0.5",
        asset: Asset.native(),
        source: motherAcc.publicKey(),
      }),
    );
  }

  if (!alreadyTrusted) {
    builder.addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: buyerPubKey,
      }),
    );
  }

  builder.setTimeout(0);
  const tx = builder.build();
  tx.sign(motherAcc, buyerKeypair);
  await submitSignedXDRToServer4User(tx.toXDR());
  return { activated: !alreadyActive, trustlineEstablished: !alreadyTrusted };
}

export async function ensureBuyerTrustline({
  buyerPubKey,
  buyerSecret,
}: {
  buyerPubKey: string;
  buyerSecret: string;
}): Promise<void> {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const buyerKeypair = Keypair.fromSecret(buyerSecret);

  const motherAccount = await server.loadAccount(motherAcc.publicKey());
  const builder = new TransactionBuilder(motherAccount, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  builder
    .addOperation(
      Operation.payment({
        destination: buyerPubKey,
        amount: "0.5",
        asset: Asset.native(),
        source: motherAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: buyerPubKey,
      }),
    )
    .setTimeout(0);

  const tx = builder.build();
  tx.sign(motherAcc, buyerKeypair);
  await submitSignedXDRToServer4User(tx.toXDR());
}

export async function sendSiteAsset2pub(
  pubkey: string,
  siteAssetAmount: number,
  userEmail?: string,
) {
  let isActivated = await isStellarAccountActivated(pubkey);
  let hasTrust =
    isActivated &&
    (await checkTrustline(pubkey, PLATFORM_ASSET.code, PLATFORM_ASSET.issuer));

  if ((!isActivated || !hasTrust) && userEmail) {
    try {
      const buyerSecret = await getAccSecretFromRubyApi(userEmail);
      if (!isActivated) {
        await ensureBuyerActivatedAndTrusted({
          buyerPubKey: pubkey,
          buyerSecret,
        });
        isActivated = true;
        hasTrust = true;
      } else if (!hasTrust) {
        await ensureBuyerTrustline({
          buyerPubKey: pubkey,
          buyerSecret,
        });
        hasTrust = true;
      }
    } catch (err) {
      console.error(
        "Failed to auto-activate or establish trustline for custodial account:",
        err,
      );
    }
  }

  if (!hasTrust) {
    throw new Error(`User does not have trustline for ${PLATFORM_ASSET.code}`);
  }

  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const motherBalance = await getAssetBalance(
    motherAcc.publicKey(),
    PLATFORM_ASSET.code,
    PLATFORM_ASSET.issuer,
  );
  if (motherBalance < siteAssetAmount) {
    throw new Error(
      `Platform has insufficient ${PLATFORM_ASSET.code} inventory (${motherBalance.toFixed(2)} available, ${siteAssetAmount.toFixed(2)} requested).`,
    );
  }

  const server = new Horizon.Server(STELLAR_URL);
  const transactionInitializer = await server.loadAccount(
    motherAcc.publicKey(),
  );

  const Tx = new TransactionBuilder(transactionInitializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: siteAssetAmount.toFixed(7).toString(),
        asset: PLATFORM_ASSET,
        source: motherAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx.sign(motherAcc);

  return Tx.toXDR();
}

export async function sendXLM_SiteAsset(props: {
  siteAssetAmount: number;
  pubkey: string;
  xlm: number;
  secret: string;
}) {
  const { pubkey, siteAssetAmount, xlm, secret } = props;

  const server = new Horizon.Server(STELLAR_URL);

  const storageAcc = Keypair.fromSecret(STORAGE_SECRET);
  const pubAcc = Keypair.fromSecret(secret);

  const transactionInializer = await server.loadAccount(storageAcc.publicKey());

  const Tx = new TransactionBuilder(transactionInializer, {
    fee: TrxBaseFee,
    networkPassphrase,
  })
    .addOperation(
      Operation.createAccount({
        destination: pubkey,
        startingBalance: xlm.toString(),
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: PLATFORM_ASSET,
        source: pubkey,
      }),
    )
    .addOperation(
      Operation.payment({
        destination: pubkey,
        amount: siteAssetAmount.toString(),
        asset: PLATFORM_ASSET,
        source: storageAcc.publicKey(),
      }),
    )
    .setTimeout(0)
    .build();

  Tx.sign(storageAcc, pubAcc);

  const transectionXDR = Tx.toXDR();

  return transectionXDR;
}
