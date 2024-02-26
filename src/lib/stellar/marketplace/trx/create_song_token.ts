import {
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  Networks,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import { env } from "~/env";
import {
  DEFAULT_ASSET_LIMIT,
  STELLAR_URL,
  STORAGE_PUB,
  networkPassphrase,
} from "../constant";
import log from "~/lib/logger/logger";

// transection variables

export type trxResponse = {
  successful: boolean;
  issuerAcc: { pub: string; secret: string };
  distributorSecret: string;
  ipfsHash: string;
  error?: { status: number; msg: string };
};

export async function firstTransection({
  assetCode,
  nftLimit,
  motherSecret,
  storageSecret,
  ipfsHash,
}: {
  assetCode: string;
  nftLimit: number; // full number
  motherSecret: string;
  storageSecret: string;
  ipfsHash: string;
}) {
  try {
    const server = new Server(STELLAR_URL);
    // mother acc

    const motherAcc = Keypair.fromSecret(motherSecret);
    const limit = (nftLimit * Number(DEFAULT_ASSET_LIMIT))
      .toFixed(7)
      .toString();

    // generating new mother account everytime
    // let motherAcc = Keypair.random();
    // await fundAccount(motherAcc);

    // storageAcc
    // log.info(STELLAR_URL);
    // log.info("storageSecret", storageSecret);
    // log.info("motherSec", motherSecret);

    const storageAcc = Keypair.fromSecret(storageSecret);

    // Create two new Acc
    // issuer
    const issuerAcc = Keypair.random();
    // distributor
    const distributorAcc = Keypair.random();

    const musicAsset = new Asset(assetCode, issuerAcc.publicKey());

    const res = {
      ipfsHash: ipfsHash,
      successful: false,
      issuerAcc: {
        pub: issuerAcc.publicKey(),
        secret: issuerAcc.secret(),
      },
      distributorSecret: distributorAcc.secret(),
    } as trxResponse;

    const transactionInializer = await server.loadAccount(
      motherAcc.publicKey(),
    );
    for (const balance of transactionInializer.balances) {
      if (balance.asset_type === "native") {
        if (Number(balance.balance) < 5) {
          // throw new Error("You don't have sufficient balance");
          res.error = {
            msg: "You don't have sufficient balance to create asset",
            status: 400,
          };
          return res;
        }
        log.info(`XLM Balance for ${balance.balance}`);
        break;
      }
    }

    const Tx1 = new TransactionBuilder(transactionInializer, {
      fee: "200",
      networkPassphrase,
    })

      // 0
      .addOperation(
        Operation.createAccount({
          destination: issuerAcc.publicKey(),
          startingBalance: "1.5",
          source: motherAcc.publicKey(),
        }),
      )
      // 1
      .addOperation(
        Operation.createAccount({
          destination: distributorAcc.publicKey(),
          startingBalance: "1.5",
          source: motherAcc.publicKey(),
        }),
      )
      // 2
      .addOperation(
        Operation.changeTrust({
          asset: musicAsset,
          limit: limit,
          source: distributorAcc.publicKey(),
        }),
      )
      // 3
      .addOperation(
        Operation.payment({
          asset: musicAsset,
          amount: limit,
          source: issuerAcc.publicKey(),
          destination: distributorAcc.publicKey(),
        }),
      )
      // 4
      .addOperation(
        Operation.manageData({
          name: "ipfshash",
          value: ipfsHash,
          source: issuerAcc.publicKey(),
        }),
      )
      // 5
      .addOperation(
        Operation.setOptions({
          homeDomain: env.NEXT_PUBLIC_SITE_ASSET_HOME_DOMAIN,
          masterWeight: 0,
          inflationDest: issuerAcc.publicKey(),
          source: issuerAcc.publicKey(),
        }),
      )

      // 5
      .addOperation(
        Operation.changeTrust({
          asset: musicAsset,
          source: storageAcc.publicKey(),
          limit,
        }),
      )
      // 6
      .addOperation(
        Operation.payment({
          destination: storageAcc.publicKey(),
          amount: limit,
          source: issuerAcc.publicKey(),
          asset: musicAsset,
        }),
      )
      .setTimeout(0)
      .build();

    await Tx1.sign(motherAcc, issuerAcc, distributorAcc, storageAcc);

    return server
      .submitTransaction(Tx1)
      .then(async (result) => {
        log.info("Transaction successful:", result);
        const successful = result.successful;

        res.successful = successful;
        return res;
      })
      .catch((error) => {
        if (error.response) {
          console.error(
            "Transaction failed with Horizon response:",
            error.response.data,
          );
          console.error(error.response.data.extras);
          // console.error(error.response.data.extras.result_codes.operations);
          res.error = {
            status: error.response.data.status,
            msg: `${error.response.data.title}`,
          };
        } else {
          console.error("Transaction failed with an error:", error);
        }
        return res;
      });
  } catch (e) {
    log.info(e);
  }
}

export async function createAccount() {
  try {
    const motherSecret =
      "SBDMRZF6AN32VSIZGZUG2TMXU2ZX4FNEGWWHNBGV2QZE4J5XVZF3Y22G";
    const motherAcc = Keypair.fromSecret(motherSecret);
    // const motherAcc = Keypair.fromSecret(motherSecret);

    // generating new mother account everytime
    // let motherAcc = Keypair.random();
    // await fundAccount(motherAcc);

    const server = new Server("https://horizon-testnet.stellar.org");
    var parentAccount = await server.loadAccount(motherAcc.publicKey()); //make sure the parent account exists on ledger
    var childAccount = Keypair.random(); //generate a random account to create
    //create a transacion object.
    const createAccountTx = new TransactionBuilder(parentAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.createAccount({
          destination: childAccount.publicKey(),
          startingBalance: "2",
        }),
      )
      .setTimeout(180)
      .build();
    //sign the transaction with the account that was created from friendbot.
    await createAccountTx.sign(motherAcc);
    log.info("sequecne", createAccountTx.sequence);
    //submit the transaction
    let txResponse = await server
      .submitTransaction(createAccountTx)
      // some simple error handling
      .catch(function (error) {
        log.info("there was an error");
        log.info(error.response);
        log.info(error.status);
        log.info(error.extras);
        return error;
      });
    log.info(txResponse);
    // log.info("Created the new account", childAccount.publicKey());
  } catch (e) {
    console.error("ERROR!", e);
  }
}

export const getBalncesOfStorag = async () => {
  try {
    const server = new Server(STELLAR_URL);
    const account = await server.loadAccount(STORAGE_PUB);
    return account.balances;
  } catch (e) {
    log.info(e);
  }
};
export const getAccBalance = async (accPub: string) => {
  try {
    const server = new Server(STELLAR_URL);
    const account = await server.loadAccount(accPub);
    return account.balances;
  } catch (e) {
    log.info(e);
  }
};

export const checkAssetBalance = async ({
  accPub,
  assset,
}: {
  accPub: string;
  assset: { code: string; issuer: string };
}) => {
  const server = new Server(STELLAR_URL);
  const account = await server.loadAccount(accPub);

  for (const balance of account.balances) {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      // log.info(balance.asset_code);
      if (
        balance.asset_code == assset.code &&
        balance.asset_issuer == assset.issuer
      ) {
        return balance.balance;
      }
    }
  }
};

async function fundAccount(pair: Keypair) {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(
        pair.publicKey(),
      )}`,
    );
    const responseJSON = await response.json();
    log.info("SUCCESS! You have a new account :)\n", responseJSON);
  } catch (e) {
    console.error("ERROR!", e);
  }
}
