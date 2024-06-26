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
import { Loader2, Plus, Send } from "lucide-react";

import { WalletType, clientsign } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useModal } from "../hooks/use-modal-store";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  asset_code: z.string().min(1, {
    message: "Asset code Id is required.",
  }),
  // limit: z.number().positive({
  //   message: "Limit must be greater than zero.",
  // }),
  issuerId: z.string().min(1, {
    message: "IssuerId code is required.",
  }),
});

const AddAssets = () => {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === "add assets";

  const session = useSession();

  const [loading, setLoading] = useState(false);
  const { needSign } = useNeedSign();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_code: "",
      issuerId: "",
    },
  });

  const AddTrustMutation =
    api.walletBalance.wallBalance.addTrustLine.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: session?.data?.user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: clientSelect(),
        })
          .then((data) => {
            if (data) {
              toast.success("Added trustline successfully");
            } else {
              toast.error("No Data Found at TrustLine Operation");
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

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.asset_code.toUpperCase() === "XLM") {
      return toast.error("Asset Code can't be XLM");
    } else {
      if (values) {
        setLoading(true);
        AddTrustMutation.mutate({
          asset_code: values.asset_code,
          asset_issuer: values.issuerId,
          signWith: needSign(),
        });
      } else {
        toast.error("Please fill up the form correctly.");
      }
    }
  };
  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="px-6 pt-8">
          <DialogTitle className="text-center text-2xl font-bold">
            ADD ASSETS
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <FormField
                control={form.control}
                name="asset_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">
                      Asset Code
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
                name="issuerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">
                      Issuer ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        type="text"
                        className="focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Enter Issuer ID..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="px-6 py-4">
              <div className="flex items-center justify-end space-y-6">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="shrink-0 font-bold "
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" size={20} />
                  ) : (
                    <Plus className="mr-2  font-bold" size={20} />
                  )}
                  {loading ? "ADDING..." : "ADD"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssets;
