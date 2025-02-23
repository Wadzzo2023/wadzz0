
import { Asset, Horizon, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { SignUserType, WithSing } from "../utils";
import { PLATFORM_ASSET, PLATFORM_FEE, STELLAR_URL, TrxBaseFee, TrxBaseFeeInPlatformAsset, networkPassphrase } from "../constant";
import { env } from "~/env";

export const sendAssetXDRForAsset = async ({ creatorId, priceWithCost, code, issuer, signWith,
    storageSecret, userPublicKey,
    totoalTokenToSend
}: {
    creatorId: string,
    priceWithCost: number,
    code: string,
    issuer: string,
    signWith: SignUserType,
    storageSecret: string,
    userPublicKey: string,
    totoalTokenToSend: number
}) => {
    const server = new Horizon.Server(STELLAR_URL);

    const asset = new Asset(code, issuer);

    const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

    const assetStorage = Keypair.fromSecret(storageSecret);




    const transactionInializer = await server.loadAccount(
        motherAccount.publicKey(),
    );

    const Tx1 = new TransactionBuilder(transactionInializer, {
        fee: TrxBaseFee,
        networkPassphrase,
    });


    Tx1.addOperation(
        Operation.payment({
            destination: userPublicKey,
            asset: asset,
            amount: totoalTokenToSend.toFixed(7),
            source: assetStorage.publicKey(),
        })

    );
    Tx1.addOperation(
        Operation.payment({
            destination: motherAccount.publicKey(),
            asset: PLATFORM_ASSET,
            amount: priceWithCost.toFixed(7),
            source: userPublicKey,
        })
    );

    Tx1.setTimeout(0);
    const buildTrx = Tx1.build();

    buildTrx.sign(motherAccount, assetStorage);

    const xdr = buildTrx.toXDR();
    const singedXdr = WithSing({ xdr, signWith });
    return singedXdr;
}

export const sendAssetXDRForNative = async ({ creatorId, priceInXLMWithCost, code, issuer, signWith,
    storageSecret, userPublicKey,
    totoalTokenToSend
}: {
    creatorId: string,
    priceInXLMWithCost: number,
    code: string,
    issuer: string,
    signWith: SignUserType,
    storageSecret: string,
    userPublicKey: string,
    totoalTokenToSend: number
}) => {
    const server = new Horizon.Server(STELLAR_URL);

    const asset = new Asset(code, issuer);

    const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

    const assetStorage = Keypair.fromSecret(storageSecret);




    const transactionInializer = await server.loadAccount(
        motherAccount.publicKey(),
    );

    const Tx1 = new TransactionBuilder(transactionInializer, {
        fee: TrxBaseFee,
        networkPassphrase,
    });


    Tx1.addOperation(
        Operation.payment({
            destination: userPublicKey,
            asset: asset,
            amount: totoalTokenToSend.toFixed(7),
            source: assetStorage.publicKey(),
        })

    );
    Tx1.addOperation(
        Operation.payment({
            destination: motherAccount.publicKey(),
            asset: Asset.native(),
            amount: priceInXLMWithCost.toFixed(7),
            source: userPublicKey,
        })
    );

    Tx1.setTimeout(0);
    const buildTrx = Tx1.build();

    buildTrx.sign(motherAccount, assetStorage);

    const xdr = buildTrx.toXDR();
    const singedXdr = WithSing({ xdr, signWith });
    return singedXdr;
}

export const getCreatorShopAssetBalance = async ({ creatorStoragePub }: { creatorStoragePub: string }) => {
    const server = new Horizon.Server(STELLAR_URL);
    const account = await server.loadAccount(creatorStoragePub);
    const balaces = account.balances;
    return balaces;

}