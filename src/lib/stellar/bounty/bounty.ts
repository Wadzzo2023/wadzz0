import { SignUserType, WithSing } from "../utils";
import {
  Asset,
  BASE_FEE,
  Claimant,
  Horizon,
  Keypair,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { MOTHER_SECRET } from "../marketplace/SECRET";
import {
  networkPassphrase,
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
} from "../constant";
import {
  getAssetPrice,
  getAssetToUSDCRate,
  getplatformAssetNumberForXLM,
} from "../fan/get_token_price";
import { env } from "~/env";
const assetIssuer = env.NEXT_PUBLIC_STELLAR_PUBNET ? "GDEL52F3VNFTARVKRL5NYME54NMLGMRO7MU2ILDEGO2LBAUKKKBQYMV3" : "GB5AVDCDB2DRY6O2GGF4N6JXC6CAIBF7Q4RCQTWDOLFKZDQOKEEKBFEO"
const assetCode = "Wadzzo"
export async function SendBountyBalanceToMotherAccount({
  prize,
  signWith,
  userPubKey,
  secretKey,
}: {
  prize: number;

  signWith: SignUserType;
  userPubKey: string;
  secretKey?: string | undefined;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const account = await server.loadAccount(motherAcc.publicKey());

  const transaction = new TransactionBuilder(account, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  const totalAmount =
    prize + 2 * Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);

  transaction.addOperation(
    Operation.payment({
      destination: motherAcc.publicKey(),
      asset: PLATFORM_ASSET,
      amount: totalAmount.toFixed(7).toString(),
      source: userPubKey,
    }),
  );
  transaction.setTimeout(0);

  const buildTrx = transaction.build();
  buildTrx.sign(motherAcc);

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

export async function SendBountyBalanceToUserAccount({
  prize,
  userPubKey,
}: {
  prize: number;
  userPubKey: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const account = await server.loadAccount(motherAcc.publicKey());

  const platformAssetBalance = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return balance.asset_code === PLATFORM_ASSET.code;
    }
    return false;
  });
  if (
    !platformAssetBalance ||
    parseFloat(platformAssetBalance.balance) < prize
  ) {
    throw new Error("Balance is not enough to send the asset.");
  }

  const XLMBalance = await NativeBalance({ userPub: motherAcc.publicKey() });

  if (!XLMBalance?.balance || parseFloat(XLMBalance.balance) < 1.0) {
    throw new Error(
      "Please make sure you have at least 1 XLM in your account.",
    );
  }

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  });

  transaction.addOperation(
    Operation.payment({
      destination: userPubKey,
      source: motherAcc.publicKey(),
      asset: PLATFORM_ASSET,
      amount: prize.toFixed(7).toString(),
    }),
  );
  transaction.setTimeout(0);

  const buildTrx = transaction.build();
  buildTrx.sign(motherAcc);
  return buildTrx.toXDR();
}

export async function SendBountyBalanceToWinner({
  prize,
  recipientID,
}: {
  prize: number;
  recipientID: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const account = await server.loadAccount(motherAcc.publicKey());

  const receiverAcc = await server.loadAccount(recipientID);

  const platformAssetBalance = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return balance.asset_code === PLATFORM_ASSET.code;
    }
    return false;
  });
  if (
    !platformAssetBalance ||
    parseFloat(platformAssetBalance.balance) < prize
  ) {
    throw new Error("Balance is not enough to send the asset.");
  }

  const XLMBalance = await NativeBalance({ userPub: motherAcc.publicKey() });

  if (!XLMBalance?.balance || parseFloat(XLMBalance.balance) < 1.0) {
    throw new Error(
      "Please make sure you have at least 1 XLM in your account.",
    );
  }
  console.log("XLMBalance", XLMBalance);

  const hasTrust = receiverAcc.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return (
        balance.asset_code === PLATFORM_ASSET.getCode() &&
        balance.asset_issuer === PLATFORM_ASSET.getIssuer()
      );
    } else if (balance.asset_type === "native") {
      return balance.asset_type === PLATFORM_ASSET.getAssetType();
    }
    return false;
  });

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  });

  if (!hasTrust) {
    const claimants: Claimant[] = [
      new Claimant(recipientID, Claimant.predicateUnconditional()),
    ];

    transaction.addOperation(
      Operation.createClaimableBalance({
        amount: prize.toFixed(7).toString(),
        asset: PLATFORM_ASSET,
        claimants: claimants,
      }),
    );
  } else {
    transaction.addOperation(
      Operation.payment({
        destination: recipientID,
        source: motherAcc.publicKey(),
        asset: PLATFORM_ASSET,
        amount: prize.toFixed(7).toString(),
      }),
    );
  }
  transaction.setTimeout(0);

  const buildTrx = transaction.build();
  buildTrx.sign(motherAcc);
  return buildTrx.toXDR();
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

export async function SwapUserAssetToMotherUSDC({
  prize,
  userPubKey,
  secretKey,
  signWith,
}: {
  prize: number;
  userPubKey: string;
  secretKey?: string | undefined;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const account = await server.loadAccount(motherAcc.publicKey());
  const senderAcc = await server.loadAccount(userPubKey);
  const transaction = new TransactionBuilder(account, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  const trustCost = await getplatformAssetNumberForXLM(0.5);
  let totalAmount =
    prize + Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE);

  const platformAssetBalance = senderAcc.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return balance.asset_code === PLATFORM_ASSET.code;
    }
    return false;
  });



  console.log("assetIssuer", assetIssuer);
  const asset = new Asset(assetCode, assetIssuer);

  const senderHasTrustOnUSDC = senderAcc.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return (
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
      );
    }
    return false;
  });
  const receiverHasTrustOnUSDC = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return (
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
      );
    }
    return false;
  });
  if (!receiverHasTrustOnUSDC) {
    throw new Error("Please Contact Admin to add USDC trustline");
  }

  const oneUSDCEqual = await getAssetToUSDCRate();
  const oneASSETEqual = 0.01;

  const oneAssetInUSDC = oneASSETEqual / oneUSDCEqual;

  const prizeInUSDC = prize * oneAssetInUSDC;

  if (!senderHasTrustOnUSDC) {
    totalAmount += trustCost;
    if (
      !platformAssetBalance ||
      parseFloat(platformAssetBalance.balance) < totalAmount
    ) {
      throw new Error(
        `You don't have total amount of ${totalAmount} ${PLATFORM_ASSET.code} to send.`,
      );
    }
    transaction.addOperation(
      Operation.changeTrust({
        asset: asset,
        source: userPubKey,
      }),
    );
  }
  if (
    !platformAssetBalance ||
    parseFloat(platformAssetBalance.balance) < totalAmount
  ) {
    throw new Error(
      `You don't have total amount of ${totalAmount} ${PLATFORM_ASSET.code} to send.`,
    );
  }
  transaction
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        asset: PLATFORM_ASSET,
        amount: totalAmount.toFixed(7).toString(),
        source: userPubKey,
      }),
    )
    .addOperation(
      Operation.payment({
        destination: userPubKey,
        asset: asset,
        amount: prizeInUSDC.toFixed(7).toString(),
        source: motherAcc.publicKey(),
      }),
    );

  transaction.setTimeout(0);

  const buildTrx = transaction.build();
  buildTrx.sign(motherAcc);

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




export async function getHasMotherTrustOnUSDC() {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const account = await server.loadAccount(motherAcc.publicKey());
  const motherHasTrust = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return (
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
      );
    }
    return false;
  });
  if (motherHasTrust) {
    return true
  }
  return false
}


export async function getHasUserHasTrustOnUSDC(userPubKey: string) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  const userHasTrust = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return (
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
      );
    }
    return false;
  });
  if (userHasTrust) {
    return true
  }
  return false
}

export async function checkXDRSubmitted(xdr: string) {
  try {
    const server = new Horizon.Server(STELLAR_URL);
    const transaction = new Transaction(xdr, networkPassphrase);
    const txHash = transaction.hash().toString('hex');

    try {
      const transactionResult = await server.transactions().transaction(txHash).call();
      console.log("Transaction already submitted:", transactionResult);
      return true;
    } catch (error) {
      console.log("Transaction not submitted yet:", error);
      return false;
    }
  } catch (error) {
    console.log("Error in checkXDRSubmitted:", error);
    return true;
  }
}