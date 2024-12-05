
'use client'

import { useState } from "react";
import { api } from "~/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/shadcn/ui/table";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "~/components/shadcn/ui/dialog";
import toast from "react-hot-toast";
import { Label } from "~/components/shadcn/ui/label";
import { PlusIcon } from "lucide-react";
import useNeedSign from "~/lib/hook";
import { clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { clientSelect } from "~/lib/stellar/fan/utils";
import {
    PaymentChoose,
    usePaymentMethodStore,
} from "~/components/payment/payment-options";
import { Loading } from "react-daisyui";
import Alert from "../ui/alert";
import { PLATFORM_ASSET, PLATFORM_FEE, TrxBaseFee, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
const RedeeemPage = () => {
    const creator = api.fan.creator.meCreator.useQuery();

    if (creator.isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!creator.data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-xl font-semibold text-red-600">You aren{"'t"} a creator</p>
            </div>
        );
    }

    return <Redeem creatorId={creator.data.id} />;
};


interface Asset {

    code: string;
    name: string;
    limit: number | null;
    id: number;
}

export const RedeemSchema = z.object({
    maxRedeems: z.number({
        message: "Max redeems must be greater than 0",
        required_error: "Max redeems is required",
        invalid_type_error: "Max redeems must be a number",
    }).int().positive(),
    redeemCode: z.string({
        message: "Redeem code must be greater than 1 character",
        required_error: "Redeem code is required ",
    }).min(1),


});
const Redeem = ({ creatorId }: { creatorId: string }) => {
    const [openModal, setOpenModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const creatorAssets = api.fan.creator.getCreatorAllAssets.useQuery({
        creatorId: creatorId,
    });
    const [loading, setLoading] = useState(false);
    const { isOpen, setIsOpen, paymentMethod } = usePaymentMethodStore();
    const [prizeInAsset, setPrizeInAsset] = useState<number>(0);

    const [parentIsOpen, setParentIsOpen] = useState(false);
    const { needSign } = useNeedSign();
    const session = useSession();

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<z.infer<typeof RedeemSchema>>({
        resolver: zodResolver(RedeemSchema),
        mode: "onChange",
        defaultValues: {

        },
    });

    const totalFees = api.fan.trx.getRequiredPlatformAsset.useQuery({
        xlm: 0.5, // this is for the trust fee and default (trx base + platform fee)
        platformAsset: 0
    });
    const generateCode = api.fan.creator.generateRedeemCode.useMutation({
        onSuccess: (data) => {
            setLoading(false);
            toast.success("Code generated successfully");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // const DisableRedeemCode = api.fan.creator.disableRedeemCode.useMutation({
    //     onSuccess: (data) => {
    //         setLoading(false);
    //         toast.success("Code disabled successfully");
    //     },
    //     onError: (error) => {
    //         toast.error(error.message);
    //     },
    // });

    // const handleDisableCode = async (redeemCode: string | undefined) => {
    //     if (!redeemCode) {
    //         toast.error("No redeem code found");
    //     }

    //     try {
    //         const response = DisableRedeemCode.mutate({
    //             code: redeemCode,
    //         });

    //         if (response) {
    //             toast.success("Code disabled successfully");
    //         } else {
    //             toast.error("Failed to disable code");
    //         }

    //     } catch (error) {

    //     }
    // };

    const generateXDR = api.fan.creator.getXDRForCreatorRedeem.useMutation({
        onSuccess: async (data, variables) => {
            if (data) {
                try {
                    const clientResponse = await clientsign({
                        presignedxdr: data,
                        walletType: session.data?.user?.walletType,
                        pubkey: session.data?.user.id,
                        test: clientSelect(),
                    });

                    if (clientResponse) {
                        toast.success("Transaction successful");
                        generateCode.mutate({
                            assetId: variables.assetId,
                            redeemCode: variables.redeemCode,
                            maxRedeems: variables.maxRedeems,
                        });
                    } else {
                        toast.error("Transaction failed");
                    }
                } catch (signError) {
                    if (signError instanceof Error) {
                        toast.error(`Error: ${signError.message}`);
                    } else {
                        toast.error("Something went wrong.");
                    }
                } finally {
                    setOpenModal(false);
                    setLoading(false);
                    setParentIsOpen(false);
                }
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const onSubmit: SubmitHandler<z.infer<typeof RedeemSchema>> = (data) => {
        setLoading(true);
        generateXDR.mutate({
            assetId: Number(selectedAsset?.id),
            redeemCode: data.redeemCode,
            maxRedeems: data.maxRedeems,
            signWith: needSign(),
            paymentMethod: paymentMethod,
        });
    };


    if (creatorAssets.isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading assets...</div>;
    }

    if (!creatorAssets.data || creatorAssets.data.length === 0) {
        return <div className="flex items-center justify-center h-screen">No assets found</div>;
    }
    console.log("creatorAssets", creatorAssets);

    const totalFee = totalFees.data ?? 0;
    const totalAmount =
        Number(totalFee + TrxBaseFeeInPlatformAsset + PLATFORM_FEE);
    const xlmPlatformFee = 2;

    return (
        <Dialog open={parentIsOpen} onOpenChange={setParentIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <PlusIcon size={16} /> Generate Redeem Code
                </Button>
            </DialogTrigger>

            <DialogContent className="min-w-[60%] min-h-[60%] max-h-[60%] items-start flex flex-col overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Redeem Codes</DialogTitle>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Name</TableHead>
                            <TableHead>Asset Code</TableHead>
                            <TableHead>Limit</TableHead>
                            <TableHead>Redeem Code</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {creatorAssets.data.map((asset) => (
                            <TableRow key={asset.id} className="">
                                <TableCell>{asset.name}</TableCell>
                                <TableCell>{asset.code}</TableCell>
                                <TableCell>{asset.limit}</TableCell>
                                <TableCell>{asset.Redeem[asset.Redeem.length - 1]?.code ?? "No Redeem Code"} </TableCell>
                                <TableCell>{asset.Redeem[asset.Redeem.length - 1]?.totalRedeemable ?? "No Redeem Code"} </TableCell>
                                <TableCell>
                                    <Button
                                        disabled={(() => {
                                            const lastRedeem = asset.Redeem?.[asset.Redeem.length - 1];
                                            return lastRedeem && lastRedeem.remaining > 0;
                                        })()}
                                        onClick={() => {
                                            setSelectedAsset(asset);
                                            setOpenModal(true);
                                        }}
                                    >
                                        Generate Code
                                    </Button>
                                    {/* <Button
                                        variant={"destructive"}

                                        onClick={() => {
                                            handleDisableCode(asset.Redeem[asset.Redeem.length - 1]?.code)
                                        }}
                                    >
                                        Expired Code
                                    </Button> */}

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Redeem Code</DialogTitle>
                            <DialogDescription>
                                Set the maximum number of times this code can be redeemed for asset: {selectedAsset?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex w-full flex-col gap-4 rounded-3xl bg-base-200 p-5"
                        >
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="maxRedeems" className="text-right">
                                    Max Redeems
                                </Label>
                                <input
                                    id="maxRedeems"
                                    type="number"
                                    {...register("maxRedeems", {
                                        valueAsNumber: true,
                                    })}
                                    className="col-span-3"
                                    min="1"
                                />
                                {errors.maxRedeems && (
                                    <div className="label">
                                        <span className="label-text-alt text-warning">
                                            {errors.maxRedeems.message}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="redeemCode" className="text-right">
                                    Redeem Code
                                </Label>
                                <input
                                    id="redeemCode"
                                    type="text"  {...register("redeemCode")}
                                    className="col-span-3"

                                />
                                {errors.redeemCode && (
                                    <div className="label">
                                        <span className="label-text-alt text-warning">
                                            {errors.redeemCode.message}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </form>
                        <DialogFooter>
                            <div className="flex w-full flex-col gap-2">
                                <PaymentChoose
                                    costBreakdown={[
                                        {
                                            label: "Cost",
                                            amount:
                                                paymentMethod === "asset"
                                                    ? totalAmount * getValues("maxRedeems")
                                                    :
                                                    Number(0.5 + TrxBaseFee) * getValues("maxRedeems") + xlmPlatformFee,
                                            highlighted: true,
                                            type: "cost",
                                        },

                                        {
                                            label: "Total Cost",
                                            amount:
                                                paymentMethod === "asset"
                                                    ? totalAmount * getValues("maxRedeems")
                                                    : Number(0.5 + TrxBaseFee) * getValues("maxRedeems") + xlmPlatformFee,
                                            highlighted: false,
                                            type: "total",
                                        },
                                    ]}
                                    XLM_EQUIVALENT={
                                        Number(0.5 + TrxBaseFee) * getValues("maxRedeems") + xlmPlatformFee
                                    }
                                    handleConfirm={handleSubmit(onSubmit)}
                                    loading={loading}
                                    requiredToken={totalAmount * getValues("maxRedeems")}
                                    trigger={
                                        <Button disabled={loading} className="w-full">
                                            {loading && (
                                                <div role="status">
                                                    <svg
                                                        aria-hidden="true"
                                                        className="mr-2 h-4 w-4 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                                                        viewBox="0 0 100 101"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path
                                                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                            fill="currentColor"
                                                        />
                                                        <path
                                                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                            fill="currentFill"
                                                        />
                                                    </svg>
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            )}
                                            Assign Code
                                        </Button>
                                    }
                                />

                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


            </DialogContent>
        </Dialog >
    );
};





export default RedeeemPage;
