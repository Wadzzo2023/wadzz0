import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  networkPassphrase,
  PLATFORM_ASSET,
  PLATFORM_FEE,
  STELLAR_URL,
  TrxBaseFee,
  TrxBaseFeeInPlatformAsset,
} from "../constant";
import { MOTHER_SECRET } from "../marketplace/SECRET";
import { SignUserType, WithSing } from "../utils";

const assetIssuer = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const assetCode = "USDC";

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
    prize + (2 * Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE));

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

export async function SendBountyBalanceToMotherAccountViaXLM({
  prizeInXLM,
  signWith,
  userPubKey,
  secretKey,
}: {
  prizeInXLM: number;
  signWith: SignUserType;
  userPubKey: string;
  secretKey?: string | undefined;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);

  const account = await server.loadAccount(userPubKey);

  const transaction = new TransactionBuilder(account, {
    fee: TrxBaseFee,
    networkPassphrase,
  });

  const totalAmount = prizeInXLM + 2 + 1;

  transaction.addOperation(
    Operation.payment({
      destination: motherAcc.publicKey(),
      asset: Asset.native(),
      amount: totalAmount.toFixed(7).toString(),
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
      return balance.asset_code === PLATFORM_ASSET.code && balance.asset_issuer === PLATFORM_ASSET.issuer
    }
    return false;
  });
  //console.log("platformAssetBalance.............", platformAssetBalance);

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

export async function SendBountyBalanceToUserAccountViaXLM({
  prizeInXLM,
  userPubKey,
}: {
  prizeInXLM: number;
  userPubKey: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
  const account = await server.loadAccount(motherAcc.publicKey());

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  });

  transaction.addOperation(
    Operation.payment({
      destination: userPubKey,
      asset: Asset.native(),
      amount: prizeInXLM.toFixed(7).toString(),
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
  //console.log("account", account);
  const receiverAcc = await server.loadAccount(recipientID);

  const platformAssetBalance = account.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return balance.asset_code === PLATFORM_ASSET.code && balance.asset_issuer === PLATFORM_ASSET.issuer;
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
  //console.log("XLMBalance", XLMBalance);

  const hasTrust = receiverAcc.balances.some((balance) => {
    //console.log(balance);
    return (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === PLATFORM_ASSET.getCode() &&
      balance.asset_issuer === PLATFORM_ASSET.getIssuer()
    );
  });

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  });

  if (!hasTrust) {
    throw new Error(`User Doesn't have trust, Please trust the ${PLATFORM_ASSET.code} first.`);
  }



  transaction.addOperation(
    Operation.payment({
      destination: recipientID,
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

export async function SendBountyBalanceToWinnerViaXLM({
  prizeInXLM,
  recipientID,
}: {
  prizeInXLM: number;
  recipientID: string;
}) {
  const server = new Horizon.Server(STELLAR_URL);
  const motherAcc = Keypair.fromSecret(MOTHER_SECRET);

  const account = await server.loadAccount(motherAcc.publicKey());

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
      destination: recipientID,
      source: motherAcc.publicKey(),
      asset: Asset.native(),
      amount: prizeInXLM.toFixed(7).toString(),
    }),
  );

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
  priceInBand,
  priceInUSD,
  userPubKey,
  secretKey,
  signWith,
}: {
  priceInBand: number;
  priceInUSD: number;
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

  const platformAssetBalance = senderAcc.balances.find((balance) => {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      return balance.asset_code === PLATFORM_ASSET.code && balance.asset_issuer === PLATFORM_ASSET.issuer;
    }
    return false;
  });

  const asset = new Asset(assetCode, assetIssuer);

  const senderHasTrustOnUSDC = senderAcc.balances.some((balance) => {
    //console.log(balance);
    return (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === assetIssuer
    );
  });

  const receiverHasTrustOnUSDC = account.balances.some((balance) => {
    //console.log(balance);
    return (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === assetIssuer
    );
  });

  if (!receiverHasTrustOnUSDC) {
    throw new Error("Please Contact Admin to add USDC trustline");
  }

  if (!senderHasTrustOnUSDC) {
    if (
      !platformAssetBalance ||
      parseFloat(platformAssetBalance.balance) < priceInBand
    ) {
      throw new Error(
        `You don't have total amount of ${priceInBand} ${PLATFORM_ASSET.code} to send.`,
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
    parseFloat(platformAssetBalance.balance) < priceInBand
  ) {
    throw new Error(
      `You don't have total amount of ${priceInBand} ${PLATFORM_ASSET.code} to send.`,
    );
  }
  transaction
    .addOperation(
      Operation.payment({
        destination: motherAcc.publicKey(),
        asset: PLATFORM_ASSET,
        amount: priceInBand.toFixed(7).toString(),
        source: userPubKey,
      }),
    )
    .addOperation(
      Operation.payment({
        destination: userPubKey,
        asset: asset,
        amount: priceInUSD.toFixed(7).toString(),
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
  const motherHasTrust = account.balances.some((balance) => {
    //console.log(balance);
    return (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === assetIssuer
    );
  });
  if (motherHasTrust) {
    return true;
  }
  return false;
}

export async function getHasUserHasTrustOnUSDC(userPubKey: string) {
  const server = new Horizon.Server(STELLAR_URL);
  const account = await server.loadAccount(userPubKey);
  const userHasTrust = account.balances.some((balance) => {
    //console.log(balance);
    return (
      (balance.asset_type === "credit_alphanum4" ||
        balance.asset_type === "credit_alphanum12") &&
      balance.asset_code === assetCode &&
      balance.asset_issuer === assetIssuer
    );
  });

  return userHasTrust;
}

export async function checkXDRSubmitted(xdr: string) {
  try {
    const server = new Horizon.Server(STELLAR_URL);
    const transaction = new Transaction(xdr, networkPassphrase);
    const txHash = transaction.hash().toString("hex");

    try {
      const transactionResult = await server
        .transactions()
        .transaction(txHash)
        .call();
      //console.log("Transaction already submitted:", transactionResult);
      return true;
    } catch (error) {
      //console.log("Transaction not submitted yet:", error);
      return false;
    }
  } catch (error) {
    //console.log("Error in checkXDRSubmitted:", error);
    return true;
  }
}
