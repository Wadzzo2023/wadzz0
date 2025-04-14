import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '~/utils/api';
import toast from 'react-hot-toast';
import { Creator, VanitySubscription, } from '@prisma/client';
import { format, formatDistanceToNow } from 'date-fns';
import { env } from '~/env';
import { PLATFORM_ASSET } from '~/lib/stellar/constant';
import useNeedSign from '~/lib/hook';
import { clientsign } from 'package/connect_wallet';
import { clientSelect } from '~/lib/stellar/fan/utils';
import { useSession } from 'next-auth/react';
import { Copy } from 'lucide-react';

const VanityURLSchema = z.object({
    vanityURL: z.string().min(2).max(30),
});

type VanityURLFormData = z.infer<typeof VanityURLSchema>;

export type CreatorWithSubscription = Creator & {
    vanitySubscription: VanitySubscription | null;
};

export function VanityURLManager({ creator }: { creator: CreatorWithSubscription }) {

    const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'expired' | 'none'>('none');
    const changingCost = PLATFORM_ASSET.code.toLocaleLowerCase() === 'wadzzo' ? 500 : 750000;
    const settingCost = PLATFORM_ASSET.code.toLocaleLowerCase() === 'wadzzo' ? 200 : 300000;
    const session = useSession()
    const [loading, setLoading] = useState(false);
    const { needSign } = useNeedSign()
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    const CreateOrUpdateVanityURL = api.fan.creator.createOrUpdateVanityURL.useMutation({
        onSuccess: (data, variables) => {
            if (variables.isChanging) {
                toast.success('Vanity URL changed successfully');
            }
            else {
                toast.success('Vanity URL set successfully');
            }
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        }
    })

    const mutation = api.fan.creator.updateVanityURL.useMutation({
        onSuccess: async (data, variables) => {
            if (data) {
                try {
                    setLoading(true);
                    const clientResponse = await clientsign({
                        presignedxdr: data,
                        walletType: session.data?.user?.walletType,
                        pubkey: session.data?.user?.id,
                        test: clientSelect(),
                    });
                    if (clientResponse) {
                        setLoading(true);
                        CreateOrUpdateVanityURL.mutate({
                            amount: variables.cost,
                            isChanging: variables.isChanging,
                            vanityURL: variables.vanityURL ?? '',
                        })
                        setLoading(false);
                        reset();

                    } else {
                        setLoading(false);
                        reset();
                        toast.error("Error in signing transaction");
                    }

                } catch (error) {
                    setLoading(false);
                    console.error("", error);
                    reset();
                }
            }
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        },
    });

    const { data: updatedCreator, refetch: refetchCreator } = api.fan.creator.meCreator.useQuery(undefined, {
        initialData: creator,
        refetchInterval: false,
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<VanityURLFormData>({
        resolver: zodResolver(VanityURLSchema),
        defaultValues: {
            vanityURL: updatedCreator?.vanityURL ?? '',
        },
    });
    const checkAvailability = api.fan.creator.checkVanityURLAvailability.useQuery(
        { vanityURL: watch('vanityURL') },
        {
            onSuccess: (data) => {
                //console.log("data", data)
                setIsAvailable(data.isAvailable);
            },
        },

    );
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'vanityURL' && value.vanityURL && value.vanityURL !== updatedCreator?.vanityURL) {
                checkAvailability.refetch();
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, checkAvailability, updatedCreator?.vanityURL]);

    useEffect(() => {
        if (creator?.vanitySubscription) {
            setSubscriptionStatus(creator.vanitySubscription.endDate >= new Date() ? 'active' : 'expired');
        } else {
            setSubscriptionStatus('none');
        }
        reset({ vanityURL: updatedCreator?.vanityURL ?? '' });
    }, [updatedCreator, reset]);

    const onSubmit = (data: VanityURLFormData) => {
        if (data.vanityURL === updatedCreator?.vanityURL && subscriptionStatus === 'active') {
            toast.error('No changes detected');
            return;
        }
        if (data.vanityURL === '') {
            toast.error('Vanity URL cannot be empty');
            return;
        }
        if (!isAvailable) {
            toast.error('This vanity URL is not available');
            return;
        }

        mutation.mutate({
            vanityURL: (subscriptionStatus === 'active' || subscriptionStatus === 'none') ? data.vanityURL : updatedCreator?.vanityURL,
            cost: subscriptionStatus === 'active' ? changingCost : settingCost,
            isChanging: subscriptionStatus === 'active' ? true : false,
            signWith: needSign(),
        });

    };
    const copyToClipboard = () => {
        const vanityURL = `${env.NEXT_PUBLIC_ASSET_CODE.toLocaleLowerCase() === 'wadzzo' ? 'https://app.wadzzo.com' : 'https://bandcoin.io'}/${watch('vanityURL')}`;
        navigator.clipboard.writeText(vanityURL).then(() => {
            toast.success('Vanity URL copied to clipboard');
        }).catch((err) => {
            console.error('Failed to copy: ', err);
            toast.error('Failed to copy Vanity URL');
        });
    };
    return (
        <div className="space-y-6 bg-base-200 p-6 rounded-lg shadow-md w-full">
            <h3 className="text-2xl font-bold">Vanity URL</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
                <div className="">
                    <label className="label">
                        <span className="label-text font-semibold">Your Vanity URL</span>
                        <button
                            type="button"
                            onClick={copyToClipboard}
                            className="btn btn-ghost btn-sm ml-2"
                            aria-label="Copy Vanity URL"
                        >
                            Copy <Copy className="h-4 w-4" />
                        </button>
                    </label>
                    <div className="flex items-center space-x-2 w-full">
                        <span className="text-base-content/70">{env.NEXT_PUBLIC_ASSET_CODE.toLocaleLowerCase() === 'wadzzo' ? 'https://app.wadzzo.com' : 'https://bandcoin.io'}/</span>
                        <div className="flex flex-col relative">
                            <input
                                disabled={subscriptionStatus === 'expired'}
                                type="text"
                                onInput={(e) => (e.currentTarget.value = e.currentTarget.value.toLowerCase())}
                                {...register('vanityURL')}
                                className={`input input-bordered w-full ${isAvailable === true ? 'border-success' : isAvailable === false ? 'border-error' : ''
                                    }`}
                                placeholder="your-custom-url"
                            />

                            {isAvailable !== null && (
                                <span className={` ${isAvailable ? 'text-success' : 'text-error'
                                    }`}>
                                    {isAvailable ? 'Available' : 'Not Available'}
                                </span>
                            )}
                        </div>

                    </div>

                    {errors.vanityURL && (
                        <label className="label">
                            <span className="label-text-alt text-error">{errors.vanityURL.message}</span>
                        </label>
                    )}
                </div>
                {
                    subscriptionStatus === 'none' && (
                        <button
                            disabled={loading || mutation.isLoading}
                            type='submit'
                            className="btn btn-primary w-full">
                            Set Vanity URL
                        </button>
                    )
                }
                {
                    subscriptionStatus === 'active' && (
                        <button
                            type='submit'
                            disabled={loading || mutation.isLoading || updatedCreator?.vanityURL === ''}
                            className="btn btn-secondary w-full">
                            Change Vanity URL
                        </button>
                    )
                }
                {
                    subscriptionStatus === 'expired' && (
                        <button
                            disabled={loading || mutation.isLoading || updatedCreator?.vanityURL === ''}
                            type='submit'
                            className="btn btn-secondary w-full">
                            Renew Vanity URL
                        </button>
                    )
                }
            </form>

            <div className="text-sm text-base-content/70 space-y-2">
                <p>
                    {subscriptionStatus === 'active'
                        ? `Changing your vanity URL will cost ${PLATFORM_ASSET.code.toLocaleLowerCase() === 'wadzzo' ? '500 Wadzzo' : '750,000 Bandcoin'}.`
                        : `Setting up a vanity URL costs ${PLATFORM_ASSET.code.toLocaleLowerCase() === 'wadzzo' ? '200 Wadzzo' : '300,000 Bandcoin'} per month.`}
                </p>
                {subscriptionStatus !== 'none' && (
                    <div className="bg-base-300 p-4 rounded-md">
                        <h4 className="font-semibold mb-2">Subscription Status</h4>
                        <p className={`font-medium ${subscriptionStatus === 'active' ? 'text-success' : 'text-error'}`}>
                            {subscriptionStatus === 'active' ? 'Active' : 'Expired'}
                        </p>
                        {creator.vanitySubscription && (
                            <>
                                <p>Start Date: {format(new Date(creator.vanitySubscription.startDate), 'PPP')}</p>
                                <p>End Date: {format(new Date(creator.vanitySubscription.endDate), 'PPP')}</p>
                                {
                                    subscriptionStatus === 'active' && (
                                        <p>Time Remaining: {formatDistanceToNow(new Date(creator.vanitySubscription.endDate))}</p>
                                    )
                                }
                                <p>Last Payment: {creator.vanitySubscription?.lastPaymentAmount} {PLATFORM_ASSET.code}</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

