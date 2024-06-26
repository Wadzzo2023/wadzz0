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
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Send } from "lucide-react";

import { WalletType, clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useModal } from "../hooks/use-modal-store";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  recipientId: z.string().min(1, {
    message: "Recipient Id is required.",
  }),
  amount: z.number().positive({
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
  const { data } = api.walletBalance.wallBalance.getWalletsBalance.useQuery();
  const { needSign } = useNeedSign();
  const isModalOpen = isOpen && type === "send assets";
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientId: "",
      amount: 0,
      selectItem: "",
    },
  });

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
      onSuccess(data) {
        console.log("Type", session.data?.user?.walletType);
        clientsign({
          presignedxdr: data.xdr,
          walletType: session.data?.user?.walletType,
          pubkey: data.pubKey,
          test: clientSelect(),
        })
          .then((data) => {
            if (data) {
              toast.success("Transaction successful");
              api
                .useUtils()
                .walletBalance.wallBalance.getWalletsBalance.refetch()
                .catch(() => console.log("Error refetching balance"));

              api
                .useUtils()
                .walletBalance.wallBalance.getNativeBalance.refetch()
                .catch(() => console.log("Error refetching balance"));
            } else {
              toast.error("Transaction failed");
            }
          })
          .catch((e) => {
            toast.error(`Error: ${e}` || "Something went wrong.");
          })
          .finally(() => {
            setLoading(false);
            handleClose();
          });
      },
      onError(error) {
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

  const handleClose = () => {
    form.reset();
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
                      Recipient ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Recipient ID..."
                        {...field}
                      />
                    </FormControl>
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
                          <SelectValue placeholder="Select Wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Wallets</SelectLabel>
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
              <Button size="lg" variant="default" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" size={20} />
                ) : (
                  <Send className="mr-2" size={15} />
                )}
                {loading ? "SENDING..." : "SEND"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SendAssets;
