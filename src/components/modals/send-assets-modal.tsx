"use client";
import { useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import qs from "query-string";

import axios from "axios";
import { useModal } from "../hooks/use-model-store";

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

const formSchema = z.object({
  recipientId: z.string().min(1, {
    message: "Recipient Id is required.",
  }),
  amount: z.number().positive({
    message: "Amount must be greater than zero.",
  }),
  asset_code: z.string().min(1, {
    message: "Asset code is required.",
  }),
});

interface BalanceType {
  asset_code: string;
  assetBalance: number;
}

const SendAssets = () => {
  const { isOpen, onClose, type } = useModal();
  const { data, isLoading } =
    api.walletBalance.wallBalance.getWalletsBalance.useQuery();

  const isModalOpen = isOpen && type === "send assets";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientId: "",
      amount: 0,
      asset_code: "",
    },
  });

  const assetWithBalance: BalanceType[] = (data ?? [])
    .map((balance) => {
      if (balance.asset_code !== "") {
        return {
          asset_code: balance.asset_code,
          assetBalance: parseFloat(balance.balance),
        };
      }
      return null;
    })
    .filter((balance): balance is BalanceType => balance !== null);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                name="asset_code"
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
                            {assetWithBalance.map((wallet, indx) => (
                              <SelectItem
                                key={`${wallet.asset_code}-${indx}`}
                                value={wallet.asset_code}
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
              <Button size="lg" variant="default" disabled={isLoading}>
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
