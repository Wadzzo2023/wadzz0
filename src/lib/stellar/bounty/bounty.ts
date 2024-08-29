import { SignUserType, WithSing } from "../utils";
import { BASE_FEE, Horizon, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { PLATFROM_ASSET, STELLAR_URL, networkPassphrase } from "./constant";
import { MOTHER_SECRET } from "../marketplace/SECRET";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";

export async function SendBountyBalanceToMotherAccount({
    price,
    signWith,
    userPubKey,
    secretKey
}: {

    price: number,

    signWith: SignUserType,
    userPubKey: string,
    secretKey?: string | undefined
}) {
    const server = new Horizon.Server(STELLAR_URL);
    const account = await server.loadAccount(userPubKey);
    // console.log("account", account);
    const destination = Keypair.fromSecret(MOTHER_SECRET);

    const accBalance = account.balances.find((balance) => {
        if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
            return balance.asset_code === PLATFROM_ASSET.code;
        } else if (balance.asset_type === 'native') {
            return balance.asset_type === PLATFROM_ASSET.getAssetType();
        }
        return false;
    });
    if (!accBalance || parseFloat(accBalance.balance) < price) {
        throw new Error('Balance is not enough to send the asset.');
    }

    console.log("accBalance", accBalance);
    const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE.toString(),
        networkPassphrase,
    });

    transaction.addOperation(
        Operation.payment({
            destination: destination.publicKey(),
            asset: PLATFROM_ASSET,
            amount: price.toString(),
        })
    );
    transaction.setTimeout(0);

    const buildTrx = transaction.build();

    if (signWith && 'email' in signWith && secretKey) {
        const xdr = buildTrx.toXDR();
        const signedXDr = await WithSing({
            xdr: xdr,
            signWith: signWith
        });
        return { xdr: signedXDr, pubKey: userPubKey };
    }
    return { xdr: buildTrx.toXDR(), pubKey: userPubKey };
}


export async function SendBountyBalanceToUserAccount({
    price,
    userPubKey,

}: {
    price: number,
    userPubKey: string,
}) {
    const server = new Horizon.Server(STELLAR_URL);
    const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
    const account = await server.loadAccount(motherAcc.publicKey());

    const accBalance = account.balances.find((balance) => {
        if (balance.asset_type === 'credit_alphanum4' || balance.asset_type === 'credit_alphanum12') {
            return balance.asset_code === PLATFROM_ASSET.code;
        } else if (balance.asset_type === 'native') {
            return balance.asset_type === PLATFROM_ASSET.getAssetType();
        }
        return false;
    });
    if (!accBalance || parseFloat(accBalance.balance) < price) {
        throw new Error('Balance is not enough to send the asset.');
    }

    console.log("accBalance", accBalance);
    const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE.toString(),
        networkPassphrase,
    });

    transaction.addOperation(
        Operation.payment({
            destination: userPubKey,
            source: motherAcc.publicKey(),
            asset: PLATFROM_ASSET,
            amount: price.toString(),
        })
    );
    transaction.setTimeout(0);

    const buildTrx = transaction.build();
    buildTrx.sign(motherAcc);
    return buildTrx.toXDR();
}