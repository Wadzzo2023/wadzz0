import { db } from "~/server/db"
import { addMonths } from 'date-fns'
import { SignUserType, WithSing } from "../utils";
import { Horizon, Keypair, Operation, TransactionBuilder, } from "@stellar/stellar-sdk";
import { PLATFORM_ASSET, STELLAR_URL, TrxBaseFee, networkPassphrase } from "../constant";
import { MOTHER_SECRET } from "../marketplace/SECRET";


export async function getVanitySubscriptionXDR({
    amount,
    signWith,
    userPubKey,
}: {
    amount: number;
    signWith: SignUserType;
    userPubKey: string;
}) {
    const server = new Horizon.Server(STELLAR_URL);
    const motherAcc = Keypair.fromSecret(MOTHER_SECRET);
    const account = await server.loadAccount(motherAcc.publicKey());

    const transaction = new TransactionBuilder(account, {
        fee: TrxBaseFee,
        networkPassphrase,
    });

    transaction.addOperation(
        Operation.payment({
            destination: motherAcc.publicKey(),
            asset: PLATFORM_ASSET,
            amount: amount.toFixed(7).toString(),
            source: userPubKey,
        }),
    );
    transaction.setTimeout(0);

    const buildTrx = transaction.build();
    buildTrx.sign(motherAcc);
    const xdr = buildTrx.toXDR();


    const singedXdr = WithSing({ xdr, signWith });

    return singedXdr;
}


export async function createOrRenewVanitySubscription(
    {
        creatorId,
        isChanging,
        amount,
        vanityURL
    }: {
        creatorId: string;
        isChanging: boolean;
        amount: number;
        vanityURL?: string | null;
    }

) {
    const creator = await db.creator.findUnique({
        where: { id: creatorId },
        include: { vanitySubscription: true },
    })

    if (!creator) {
        throw new Error('Creator not found')
    }


    if (isChanging) {
        // Change vanity URL
        return db.creator.update({
            where: { id: creatorId },
            data: {
                vanityURL: vanityURL,
                vanitySubscription: {
                    update: {
                        lastPaymentAmount: amount,
                    },
                },
            },
        })
    }

    const now = new Date()
    const endDate = addMonths(now, 1)

    if (creator.vanitySubscription) {
        // Renew existing subscription
        return db.vanitySubscription.update({
            where: { id: creator.vanitySubscription.id },
            data: {
                endDate,
                lastPaymentAmount: amount,
                lastPaymentDate: now,

            },
        })
    } else {
        return db.creator.update({
            where: { id: creatorId },
            data: {
                vanityURL: vanityURL,
                vanitySubscription: {
                    create: {
                        endDate,
                        lastPaymentAmount: amount,
                        lastPaymentDate: now,
                    },
                },
            },
        })


    }
}

export async function checkAvailability(
    vanityURL: string

) {
    const existingCreator = await db.creator.findUnique({
        where: { vanityURL: vanityURL },
    });

    return { isAvailable: !existingCreator };
}
