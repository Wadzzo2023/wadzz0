import {
    Asset,
    Horizon,
    Keypair,
    Operation,
    TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { PLATFORM_ASSET, PLATFORM_FEE, STELLAR_URL, TrxBaseFee, TrxBaseFeeInPlatformAsset, networkPassphrase } from "../constant";
import { SignUserType, WithSing } from "../utils";
import { P } from "pino";


export async function createRedeemXDRAsset({
    creatorId,
    signWith,
    assetCode,
    assetIssuer,
    maxRedeems,
    secretKey,
}: {
    creatorId: string;
    assetIssuer: string;
    assetCode: string;
    maxRedeems: number;
    signWith: SignUserType;
    secretKey?: string;
}) {
    const server = new Horizon.Server(STELLAR_URL);

    const asset = new Asset(PLATFORM_ASSET.code, PLATFORM_ASSET.issuer);

    const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

    const transactionInializer = await server.loadAccount(
        motherAccount.publicKey(),
    );
    console.log("transactionInializer", transactionInializer);
    const Tx1 = new TransactionBuilder(transactionInializer, {
        fee: "200",
        networkPassphrase,
    });
    const amount = Number(TrxBaseFeeInPlatformAsset + PLATFORM_FEE) * maxRedeems;

    Tx1.addOperation(
        Operation.payment({
            destination: motherAccount.publicKey(),
            asset: asset,
            amount: amount.toFixed(7),
            source: creatorId,
        }),
    )
    Tx1.setTimeout(0);
    const buildTrx = Tx1.build();
    buildTrx.sign(motherAccount);
    const xdr = buildTrx.toXDR();
    const singedXdr = WithSing({ xdr, signWith });
    // console.log(singedXdr, "singedXdr");
    return singedXdr;
}


export async function createRedeemXDRNative({
    creatorId,
    signWith,
    assetCode,
    assetIssuer,
    maxRedeems,

}: {
    creatorId: string;
    assetIssuer: string;
    assetCode: string;
    maxRedeems: number;
    signWith: SignUserType;

}) {
    const server = new Horizon.Server(STELLAR_URL);

    const asset = new Asset(assetCode, assetIssuer);

    const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

    const transactionInializer = await server.loadAccount(
        motherAccount.publicKey(),
    );
    console.log("transactionInializer", transactionInializer);
    const Tx1 = new TransactionBuilder(transactionInializer, {
        fee: "200",
        networkPassphrase,
    });
    const amount = Number(TrxBaseFeeInPlatformAsset + PLATFORM_FEE) * maxRedeems;

    Tx1.addOperation(
        Operation.payment({
            destination: motherAccount.publicKey(),
            asset: asset,
            amount: amount.toFixed(7),
            source: creatorId,
        }),
    )

    Tx1.setTimeout(0);
    const buildTrx = Tx1.build();

    buildTrx.sign(motherAccount);
    const xdr = buildTrx.toXDR();
    const singedXdr = WithSing({ xdr, signWith });
    // console.log(singedXdr, "singedXdr");
    return singedXdr;
}


export async function claimRedeemXDR({
    creatorId,
    signWith,
    assetCode,
    assetIssuer,


}: {
    creatorId: string;
    assetIssuer: string;
    assetCode: string;

    signWith: SignUserType;

}) {
    const server = new Horizon.Server(STELLAR_URL);

    const asset = new Asset(assetCode, assetIssuer);

    const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);

    const transactionInializer = await server.loadAccount(
        motherAccount.publicKey(),
    );
    console.log("transactionInializer", transactionInializer);
    const Tx1 = new TransactionBuilder(transactionInializer, {
        fee: "200",
        networkPassphrase,
    });
    const amount = Number(TrxBaseFeeInPlatformAsset + PLATFORM_FEE);

    Tx1.addOperation(
        Operation.payment({
            destination: motherAccount.publicKey(),
            asset: asset,
            amount: amount.toFixed(7),
            source: creatorId,
        }),
    )

    Tx1.setTimeout(0);
    const buildTrx = Tx1.build();

    buildTrx.sign(motherAccount);

    const xdr = buildTrx.toXDR();
    const singedXdr = WithSing({ xdr, signWith });
    // console.log(singedXdr, "singedXdr");
    return singedXdr;
}
