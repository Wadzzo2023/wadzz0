import {
    Asset,
    Horizon,
    Keypair,
    Operation,
    TransactionBuilder,
    Transaction,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import {
    PLATFORM_ASSET,
    STELLAR_URL,
    TrxBaseFee,
    networkPassphrase,
} from "../../constant";

// Shared helper for building and signing transaction
async function buildAssetBuyTransaction({
    code,
    amountToSell,
    issuer,
    storageSecret,
    userId,
    price,
    paymentAsset,
}: {
    code: string;
    amountToSell: number;
    issuer: string;
    price: number;
    storageSecret: string;
    userId: string;
    paymentAsset: Asset;
}) {
    try {
        const assetToBuy = new Asset(code, issuer);
        const server = new Horizon.Server(STELLAR_URL);
        const motherKeypair = Keypair.fromSecret(env.MOTHER_SECRET);
        const motherAccount = await server.loadAccount(motherKeypair.publicKey());

        const storageKeypair = Keypair.fromSecret(storageSecret);
        const storageAccount = await StellarAccount.create(storageKeypair.publicKey());
        const userAccount = await StellarAccount.create(userId);
        console.log("Storage account:", storageAccount);
        // Validate trustline
        const hasTrust = userAccount.hasTrustline(assetToBuy.code, assetToBuy.issuer);
        // Validate balances
        let storageBalance;
        if (assetToBuy.isNative()) {
            storageBalance = Number(storageAccount.getNativeBalance());
        } else {
            storageBalance = storageAccount.getTokenBalance(assetToBuy.code, assetToBuy.issuer);
        }
        console.log("Storage balance:", storageBalance, storageSecret, assetToBuy.code, assetToBuy.issuer);
        if (storageBalance < amountToSell) {
            throw new Error("Insufficient asset balance in storage account.");
        }

        let userBalance;
        if (paymentAsset.isNative()) {
            userBalance = Number(userAccount.getNativeBalance());
        } else {
            userBalance = userAccount.getTokenBalance(paymentAsset.code, paymentAsset.issuer);
        }

        if (userBalance < price) {
            throw new Error("User has insufficient balance for payment.");
        }

        const txBuilder = new TransactionBuilder(motherAccount, {
            fee: TrxBaseFee,
            networkPassphrase,
        });

        // Add trustline if missing
        if (!hasTrust) {
            txBuilder.addOperation(
                Operation.changeTrust({
                    asset: assetToBuy,
                    source: userId,
                })
            );
        }

        // Transfer asset to user
        txBuilder.addOperation(
            Operation.payment({
                destination: userId,
                asset: assetToBuy,
                source: storageKeypair.publicKey(),
                amount: amountToSell.toFixed(7),
            })
        ).addOperation(
            Operation.payment({
                destination: storageKeypair.publicKey(),
                asset: paymentAsset,
                source: userId,
                amount: price.toFixed(7),
            })
        ).setTimeout(0);
        const buildTrx = txBuilder.build();
        buildTrx.sign(motherKeypair, storageKeypair);

        return {
            xdr: buildTrx.toXDR()
        };
    }
    catch (error) {
        console.error("Error building asset buy transaction:", error);
        throw error;
    }
}

// Buy using platform asset
export const GetPageAssetBuyXDRInPlatform = async (params: {
    code: string;
    amountToSell: number;
    issuer: string;
    price: number;
    storageSecret: string;
    userId: string;
}) => {
    return buildAssetBuyTransaction({
        ...params,
        paymentAsset: PLATFORM_ASSET,
    });
};

// Buy using native XLM
export const GetPageAssetBuyXDRInXLM = async (params: {
    code: string;
    amountToSell: number;
    issuer: string;
    priceXLM: number;
    storageSecret: string;
    userId: string;
}) => {
    const { priceXLM, ...rest } = params;
    return buildAssetBuyTransaction({
        ...rest,
        price: priceXLM,
        paymentAsset: Asset.native(),
    });
};
