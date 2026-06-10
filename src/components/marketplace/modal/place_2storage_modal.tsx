import { clientsign } from "package/connect_wallet/src/lib/stellar/utils";
import { useRef } from "react";
import { api } from "~/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { RadioGroup, RadioGroupItem } from "~/components/shadcn/ui/radio-group";
import { Label } from "~/components/shadcn/ui/label";
import { Coins, DollarSign, Loader } from "lucide-react";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { addrShort } from "~/utils/utils";
import { PaymentMethod, PaymentMethodEnum } from "~/components/modals/pin-info-modal";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import Alert from "~/components/ui/alert";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import RechargeLink from "../recharge/link";

export const PlaceMarketFormSchema = z.object({
  placingCopies: z
    .number({
      required_error: "Placing Copies  must be a number",
      invalid_type_error: "Placing Copies must be a number",
    })
    .nonnegative()
    .int(),
  code: z
    .string()
    .min(4, { message: "Must be a minimum of 4 characters" })
    .max(12, { message: "Must be a maximum of 12 characters" }),
  issuer: z.string(),
});

export type PlaceMarketFormType = z.TypeOf<typeof PlaceMarketFormSchema>;

export default function StorageCreateDialog({
  item,
}: {
  item: { code: string; issuer: string; copies: number; name: string };
}) {
  const storage = api.admin.user.hasStorage.useQuery();

  if (storage.data) {
    const storagePub = storage.data.storage;
    if (storagePub) {
      return <PlaceNFT2StorageModal item={item} />;
    } else {
      // create storage
      return <StorageCreate />;
    }
  }
}

function StorageCreate() {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethodEnum.enum.asset,
  );

  const { platformAssetBalance, getXLMBalance } = useUserStellarAcc();
  const { needSign } = useNeedSign();
  const session = useSession();

  const xlmBalance = getXLMBalance() ?? "0";

  const requiredToken = api.fan.trx.getRequiredPlatformAsset.useQuery({
    xlm: 1,
  });

  const makeCreatorMutation = api.fan.creator.makeMeCreator.useMutation({
    onSuccess: () => {
      toast.success("Storage account created successfully");
      setIsOpen(false);
    },
  });

  const [signLoading, setSignLoading] = useState(false);

  const xdr = api.fan.trx.createStorageAccount.useMutation({
    onSuccess: (data) => {
      const { xdr, storage } = data;
      setSignLoading(true);
      const toastId = toast.loading("Creating account");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id,
        walletType: session.data?.user.walletType,
        test: clientSelect(),
      })
        .then((isSuccess) => {
          if (isSuccess) {
            makeCreatorMutation.mutate(storage);
          } else {
            toast.error("Failed to create account");
          }
        })
        .catch((e) => console.log(e))
        .finally(() => {
          setIsOpen(false);
          toast.dismiss(toastId);
          setSignLoading(false);
        });
    },
  });

  const loading =
    xdr.isLoading || makeCreatorMutation.isLoading || signLoading;

  const handleConfirm = () => {
    xdr.mutate({
      signWith: needSign(),
      native: paymentMethod === PaymentMethodEnum.enum.xlm,
    });
  };

  const XLM_EQUIVALENT = 3;
  const requiredTokenNumber = requiredToken.data ?? 0;

  const hasSufficientBalance =
    platformAssetBalance >= requiredTokenNumber || Number(xlmBalance) >= 1;

  // Derive modal content based on balance state
  const renderModalContent = () => {
    if (requiredToken.isLoading) {
      return (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    if (!hasSufficientBalance) {
      return (
        <div className="flex flex-col gap-3 py-2">
          <Alert
            type="error"
            content={`Insufficient balance. You need at least ${requiredTokenNumber} ${PLATFORM_ASSET.code} to create a storage account.`}
          />
          <RechargeLink />
        </div>
      );
    }

    return (
      <>
        <p className="text-center text-sm text-muted-foreground">
          Your account will be charged to create the storage account.
        </p>

        <RadioGroup
          value={paymentMethod}
          onValueChange={(e) => setPaymentMethod(e as PaymentMethod)}
          className="mt-4 space-y-3"
        >
          {/* PLATFORM ASSET option */}
          <Label
            htmlFor={PaymentMethodEnum.enum.asset}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem
              value={PaymentMethodEnum.enum.asset}
              id={PaymentMethodEnum.enum.asset}
            />
            <Coins className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">
                Pay with {PLATFORM_ASSET.code.toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">
                Use platform tokens
              </div>
            </div>
            <span className="font-semibold">
              {requiredTokenNumber} {PLATFORM_ASSET.code.toUpperCase()}
            </span>
          </Label>

          {/* XLM option */}
          <Label
            htmlFor={PaymentMethodEnum.enum.xlm}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem
              value={PaymentMethodEnum.enum.xlm}
              id={PaymentMethodEnum.enum.xlm}
            />
            <DollarSign className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Pay with XLM</div>
              <div className="text-xs text-muted-foreground">
                Use Stellar Lumens
              </div>
            </div>
            <span className="font-semibold">{XLM_EQUIVALENT} XLM</span>
          </Label>
        </RadioGroup>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          You will be charged{" "}
          {paymentMethod === PaymentMethodEnum.enum.asset
            ? `${requiredTokenNumber} ${PLATFORM_ASSET.code}`
            : `${XLM_EQUIVALENT} XLM`}{" "}
          to create storage account.
        </p>

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Payment"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={requiredToken.isLoading}>
          {requiredToken.isLoading && (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          )}
          Place in Storage
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {hasSufficientBalance
              ? "Create Storage Account"
              : "Insufficient Balance"}
          </DialogTitle>
          {hasSufficientBalance && (
            <DialogDescription className="text-center">
              Choose how you&apos;d like to pay for your storage account.
            </DialogDescription>
          )}
        </DialogHeader>

        {renderModalContent()}
      </DialogContent>
    </Dialog>
  );
}
function PlaceNFT2StorageModal({
  item,
}: {
  item: {
    code: string;
    issuer: string;
    copies: number;
    name: string;
  };
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const session = useSession();
  const { needSign } = useNeedSign();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    control,
    reset,
  } = useForm<z.infer<typeof PlaceMarketFormSchema>>({
    resolver: zodResolver(PlaceMarketFormSchema),
    defaultValues: { code: item.code, issuer: item.issuer, placingCopies: 1 },
  });

  const xdrMutation = api.marketplace.market.placeNft2StorageXdr.useMutation({
    onSuccess(data, variables, context) {
      const xdr = data;
      // console.log(xdr, "...");

      const tostId = toast.loading("Signing transaction...");
      clientsign({
        presignedxdr: xdr,
        pubkey: session.data?.user.id,
        walletType: session.data?.user.walletType,
        test: clientSelect(),
      })
        .then((res) => {
          const data = getValues();
          if (res) toast.success("NFT has been placed to storage");
          modalRef.current?.close();
        })
        .catch((e) => {
          toast.error("Error signing transaction");
        })
        .finally(() => toast.dismiss(tostId));
    },
  });

  function resetState() {
    reset();
    xdrMutation.reset();
  }

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  const onSubmit: SubmitHandler<z.infer<typeof PlaceMarketFormSchema>> = (
    data,
  ) => {
    const placingCopies = getValues("placingCopies");
    if (placingCopies <= item.copies) {
      xdrMutation.mutate({
        issuer: item.issuer,
        placingCopies: getValues("placingCopies"),
        code: item.code,
        signWith: needSign(),
      });
    } else {
      toast.error("You can't place more copies than available");
    }
  };

  return (
    <>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <h3 className="mb-2 text-lg font-bold">Place in storage</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mt-4 flex flex-col items-center gap-y-2">
              <div className="flex w-full  max-w-sm flex-col rounded-lg bg-base-200 p-2 py-5">
                <p>Asset Name: {item.name}</p>
                <p>
                  Asset Code:{" "}
                  <span className="badge badge-primary">{item.code}</span>
                </p>
                {/* <p className="">Price: {item.price} XLM</p> */}
                <p className="text-sm text-error">Items left: {item.copies}</p>
                <p className="text-sm">Issuer: {addrShort(item.issuer, 15)}</p>
              </div>

              <div className=" w-full max-w-sm ">
                <label className="label">
                  <span className="label-text">Quantity</span>
                  <span className="label-text-alt">
                    Default quantity would be 1
                  </span>
                </label>
                <input
                  type="number"
                  {...register("placingCopies", {
                    valueAsNumber: true,
                    max: item.copies,
                  })}
                  min={1}
                  step={1}
                  className="input input-sm input-bordered  w-full"
                  placeholder="How many copy you want to place to market?"
                />
                {errors.placingCopies && (
                  <label className="label">
                    <span className="label-text text-error">
                      {errors.placingCopies.message}
                    </span>
                  </label>
                )}
              </div>

              {/* <div className="w-full max-w-sm">
                {placeNftMutation.isSuccess && (
                  <Alert
                    type="success"
                    content={`Your item has successfully been placed in ${env.NEXT_PUBLIC_SITE} Marketplace.`}
                  />
                )}
                {err && <Alert message={err} />}
                {xdrMutaion.isError && (
                  <Alert message={xdrMutaion.error.message} />
                )}
              </div> */}

              <div className=" flex w-full max-w-sm flex-col items-center">
                <button
                  disabled={xdrMutation.isSuccess}
                  className="btn btn-primary  w-full"
                >
                  {xdrMutation.isLoading && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Submit
                </button>
              </div>
            </div>
          </form>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => resetState()}>
                Close
              </button>
            </form>
          </div>
        </div>

        {/* <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form> */}
      </dialog>
      <Button
        className="btn btn-secondary btn-sm my-2 w-full transition duration-500 ease-in-out"
        onClick={handleModal}
      >
        Place item for sale
      </Button>
    </>
  );
}
