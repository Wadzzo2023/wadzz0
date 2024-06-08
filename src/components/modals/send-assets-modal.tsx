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
import { Send } from "lucide-react";
import { useModal } from "../hooks/use-model-store";
import { clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";

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

  const isModalOpen = isOpen && type === "send assets";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientId: "",
      amount: 0,
      selectItem: "",
    },
  });

  const assetWithBalance: BalanceType[] = (data ?? [])
    .map((balance) => {
      if (balance && balance.asset_code !== "") {
        return {
          asset_issuer: balance.asset_issuer,
          asset_code: balance.asset_code,
          assetBalance: parseFloat(balance.balance),
          asset_type: balance.asset_type,
        };
      } else {
        if (balance && balance.asset_type === "native") {
          return {
            asset_issuer: "native",
            asset_code: "XLM",
            assetBalance: parseFloat(balance.balance),
            asset_type: balance.asset_type,
          };
        }
      }
    })
    .filter((balance): balance is BalanceType => balance !== null);

  const SendMutation =
    api.walletBalance.wallBalance.sendWalletAssets.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: session?.data?.user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: data.test,
        })
          .then(() => {
            setLoading(false);
            toast.success("Transaction successful");
            handleClose();
          })
          .catch(() => {
            setLoading(false);
            toast.error("Transaction failed");
          });
      },
      onError(error) {
        setLoading(false);
        toast.error(error.message);
      },
    });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const selectedAsset: BalanceType = assetWithBalance.find(
      (asset) =>
        `${asset.asset_code}-${asset.asset_type}-${asset.asset_issuer}` ===
        values.selectItem,
    );

    if (selectedAsset?.assetBalance < values.amount) {
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
            Send Assets
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
                                {wallet.asset_code}
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
                <Send className="mr-2" size={15} /> SEND
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SendAssets;
