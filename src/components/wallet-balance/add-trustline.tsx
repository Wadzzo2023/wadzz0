"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "~/components/shadcn/ui/input";
import { clientSelect } from "~/lib/stellar/fan/utils";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "~/components/shadcn/ui/form";
import { Button } from "../shadcn/ui/button";
import { Label } from "../shadcn/ui/label";
import { Loader2, Plus, ShieldPlus } from "lucide-react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { clientsign } from "package/connect_wallet";
import { useState } from "react";
import useNeedSign from "~/lib/hook";
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

const AddTrustLine = () => {
  const session = useSession();
  const router = useRouter();
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
      onSuccess: async (data) => {
        try {
          const clientResponse = await clientsign({
            walletType: session?.data?.user?.walletType,
            presignedxdr: data.xdr,
            pubkey: data.pubKey,
            test: clientSelect(),
          });

          if (clientResponse) {
            toast.success("Added trustline successfully");
            try {
              await api
                .useUtils()
                .walletBalance.wallBalance.getWalletsBalance.refetch();
            } catch (refetchError) {
              console.log("Error refetching balance", refetchError);
            }
          } else {
            toast.error("No Data Found at TrustLine Operation");
          }
        } catch (error) {
          if (error instanceof Error) {
            toast.error(`Error: ${error.message}`);
          } else {
            toast.error("An unknown error occurred.");
          }
          console.log("Error", error);
        } finally {
          setLoading(false);
          handleClose();
        }
      },
      onError: (error) => {
        setLoading(false);
        toast.error(error.message);
      },
    });

  const handleClose = () => {
    form.reset();
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
    <div className="flex flex-col space-x-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-2 px-2">
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
                      placeholder="Enter Asset Code..."
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
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddTrustLine;
