"use client";
import { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Input } from "~/components/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "~/components/shadcn/ui/form";

import { Button } from "~/components/shadcn/ui/button";
import { api } from "~/utils/api";
import { Loader2, RefreshCcw, RotateCw, Send } from "lucide-react";

import { WalletType, clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useModal } from "../../lib/state/play/use-modal-store";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { useRouter } from "next/router";
import { fetchPubkeyfromEmail } from "~/utils/get-pubkey";
import { addrShort } from "~/utils/utils";

const formSchema = z.object({
  recipientId: z.string().length(56, {
    message: "Recipient Id is must be 56 characters long.",
  }),
  amount: z
    .number({
      required_error: "Amount is required.",
      invalid_type_error: "Amount must be a number.",
    })
    .positive({
      message: "Amount must be greater than zero.",
    }),
  selectItem: z.string().min(1, {
    message: "Asset code is required.",
  }),
});

interface BalanceType {
  asset_code: string;
  assetBalance: number;
  asset_type: string;
  asset_issuer: string;
}

const SendAssets = () => {
  const { isOpen, onClose, type } = useModal();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const { data } = api.walletBalance.wallBalance.getWalletsBalance.useQuery(
    undefined,
    {
      retry: false,
    },
  );
  const { needSign } = useNeedSign();
  const isModalOpen = isOpen && type === "send assets";
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      recipientId: "",
      amount: 0,
      selectItem: "",
    },
  });

  const {
    formState: { errors, isValid },
  } = form;

  interface CreditBalanceType {
    asset_code: string;
    assetBalance: number;
    asset_type: "credit_alphanum4" | "credit_alphanum12";
    asset_issuer: string;
  }

  interface NativeBalanceType {
    asset_code: string;
    assetBalance: number;
    asset_type: "native";
    asset_issuer: string;
  }

  type BalanceType = CreditBalanceType | NativeBalanceType;

  const assetWithBalance = data
    ?.map((balance) => {
      if (balance) {
        if (
          balance.asset_code &&
          (balance.asset_type === "credit_alphanum4" ||
            balance.asset_type === "credit_alphanum12")
        ) {
          return {
            asset_issuer: balance.asset_issuer,
            asset_code: balance.asset_code,
            assetBalance: parseFloat(balance.balance),
            asset_type: balance.asset_type,
          } as CreditBalanceType;
        } else if (balance.asset_type === "native") {
          return {
            asset_issuer: "native",
            asset_code: "XLM",
            assetBalance: parseFloat(balance.balance),
            asset_type: balance.asset_type,
          } as NativeBalanceType;
        }
      }
      return null;
    })
    .filter((balance): balance is BalanceType => balance !== null);
  const SendMutation =
    api.walletBalance.wallBalance.sendWalletAssets.useMutation({
      onSuccess: async (data) => {
        try {
          const clientResponse = await clientsign({
            presignedxdr: data.xdr,
            walletType: session.data?.user?.walletType,
            pubkey: data.pubKey,
            test: clientSelect(),
          });

          if (clientResponse) {
            toast.success("Transaction successful");
            setIsDialogOpen(false);
            try {
              await api
                .useUtils()
                .walletBalance.wallBalance.getWalletsBalance.refetch();
            } catch (balanceError) {
            }

            try {
              await api
                .useUtils()
                .walletBalance.wallBalance.getNativeBalance.refetch();
            } catch (nativeBalanceError) {
              console.log(
                "Error refetching native balance",
                nativeBalanceError,
              );
            }
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
          setLoading(false);
          await handleClose();
        }
      },
      onError: (error) => {
        if (error.data?.httpStatus === 400) {
          toast.error("Low XLM resource to perform transaction");
        }
        setLoading(false);
        toast.error(error.message);
      },
    });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const selectedAsset = assetWithBalance?.find(
      (asset) =>
        `${asset?.asset_code}-${asset?.asset_type}-${asset?.asset_issuer}` ===
        values.selectItem,
    );

    if (!selectedAsset || selectedAsset?.assetBalance < values.amount) {
      toast.error("Insufficient balance");
      return;
    }
    if (session.data?.user?.id === values.recipientId) {
      toast.error("You can't send asset to yourself.");
      return;
    }
    if (values && typeof values.selectItem === "string") {
      const parts = values.selectItem.split("-");
      if (parts.length === 3) {
        const [code, type, issuer] = parts;
        setLoading(true);
        // Ensure that code, type, and issuer are defined and not undefined
        if (code && type && issuer) {
          SendMutation.mutate({
            recipientId: values.recipientId,
            amount: values.amount,
            asset_code: code,
            asset_type: type,
            asset_issuer: issuer,
            signWith: needSign(),
          });
        } else {
          // Handle the case where any of the parts are undefined
          console.log("The input string did not split into three valid parts.");
        }
      } else {
        // Handle error: the string doesn't split into exactly three parts
        toast.error("The input string did not split into three valid parts.");
      }
    } else {
      // Handle error: selectItem is not a string
      toast.error("selectItem is not a string.");
    }
  };
  const pubkey = form.watch("recipientId");

  useEffect(() => {
    if (router.query.id) {
      form.setValue("recipientId", router.query.id as string);
    }
  }, [router.query.id, form]);

  async function fetchPubKey(): Promise<void> {
    try {
      const pub = await toast.promise(fetchPubkeyfromEmail(pubkey), {
        error: "Email don't have a pubkey",
        success: "Pubkey fetched successfully",
        loading: "Fetching pubkey...",
      });

      form.setValue("recipientId", pub, { shouldValidate: true });
    } catch (e) {
      console.error(e);
    }
  }
  const handleClose = async () => {
    form.reset();

    // Remove the id from the URL query parameters
    const { id, ...rest } = router.query;

    // Transform the remaining query parameters to a format accepted by URLSearchParams
    const newQueryString = new URLSearchParams(
      Object.entries(rest).reduce(
        (acc, [key, value]) => {
          if (typeof value === "string") {
            acc[key] = value;
          } else if (Array.isArray(value)) {
            acc[key] = value.join(",");
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    const newPath = `${router.pathname}${newQueryString ? `?${newQueryString}` : ""}`;

    await router.push(newPath, undefined, { shallow: true });
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            SEND ASSETS
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">
                      Public Key or Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="e.g. GABCD...XDBK or wz@domain.com"
                        {...field}
                      />
                    </FormControl>
                    {z.string().email().safeParse(pubkey).success && (
                      <div className="tooltip" data-tip="Fetch Pubkey">
                        <Button
                          type="button"
                          variant="link"
                          className="m-0  p-0 text-xs font-bold text-blue-500 underline"
                          onClick={fetchPubKey}
                          disabled={loading}
                        >
                          <RotateCw size={12} className="mr-1" /> GET PUBLIC KEY
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">
                      Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading}
                        className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Amount..."
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selectItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">
                      Asset Code
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="focus-visible:ring-0 focus-visible:ring-offset-0">
                          <SelectValue placeholder="Select Asset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Assets</SelectLabel>
                            {assetWithBalance?.map((wallet, idx) => (
                              <SelectItem
                                key={idx}
                                value={`${wallet?.asset_code}-${wallet?.asset_type}-${wallet?.asset_issuer}`}
                              >
                                {wallet?.asset_code}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="px-6 py-4">
              <div className="flex flex-col gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={loading || !isValid}>
                      Send Assets
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Confirmation </DialogTitle>
                    </DialogHeader>
                    <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
                      <div className="flex flex-col gap-2">
                        <p className="font-semibold">
                          Recipient Id:{" "}
                          {addrShort(form.watch("recipientId"), 10)}
                        </p>
                        <p className="font-semibold">
                          Amount: {form.watch("amount")}
                        </p>
                        <p className="font-semibold">
                          Asset Code: {form.watch("selectItem").split("-")[0]}
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="w-full">
                      <div className="flex w-full gap-4">
                        <DialogClose className="w-full">
                          <Button
                            disabled={loading}
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          disabled={loading}
                          onClick={form.handleSubmit(onSubmit)}
                          variant="destructive"
                          type="submit"
                          className="w-full"
                        >
                          Confirm
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* <Button size="lg" variant="default" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" size={20} />
                ) : (
                  <Send className="mr-2" size={15} />
                )}
                {loading ? "SENDING..." : "SEND"}
              </Button> */}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SendAssets;
