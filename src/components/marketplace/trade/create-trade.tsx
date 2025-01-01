import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { match } from "ts-pattern";
import { z } from "zod";
import { Button } from "~/components/shadcn/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/shadcn/ui/form";
import { Input } from "~/components/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { empty, error, loading, success } from "~/utils/trcp/patterns";

export const tradeFormSchema = z.object({
  selling: z.string(),
  buying: z.string(),
  amount: z.number({
    required_error: "Amount  must be a number",
    invalid_type_error: "Amount must be a number",
  }).positive(),
  price: z.number({
    required_error: "Price  must be a number",
    invalid_type_error: "Price must be a number",
  }).positive(),
});

export default function CreateTrade() {
  const [xdr, setXdr] = useState<string>();
  const session = useSession();
  const { needSign } = useNeedSign();
  const [submitLoading, setSubmitLoading] = useState(false);
  const form = useForm<z.infer<typeof tradeFormSchema>>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {},
  });

  // query
  const acc = api.wallate.acc.getAccountBalance.useQuery();

  // mutation
  const xdrMutation = api.marketplace.trade.getTradeXDR.useMutation({
    onSuccess: (xdr) => {
      setXdr(xdr);
      toast.success("XDR succesffull", { position: "bottom-right" });
    },
    onError: (e) => {
      toast.error(e.message, { position: "bottom-right" });
    },
  });

  const select = match(acc)
    .with(loading, () => <div>Loading...</div>)
    .with(error, () => <div>Error</div>)
    .with(empty, (data) => <div>No Asset</div>)
    .with(success, (data) => {
      return (
        <SelectContent>
          {data.data?.balances.map((asset) => {
            if (
              asset.asset_type == "credit_alphanum4" ||
              asset.asset_type == "credit_alphanum12"
            ) {
              return (
                <SelectItem
                  key={`${asset.asset_code}-${asset.asset_issuer}`}
                  value={`${asset.asset_code}-${asset.asset_issuer}`}
                >
                  {asset.asset_code}
                </SelectItem>
              );
            }
          })}
        </SelectContent>
      );
    })
    .otherwise(() => <div>Something went wrong</div>);

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof tradeFormSchema>) {
    xdrMutation.mutate({ ...values, signWith: needSign() });
  }
  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="m-auto max-w-xl space-y-8"
        >
          <FormField
            control={form.control}
            name="selling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Asset</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a asset" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{select}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="buying"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buying Asset</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a asset" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{select}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount you are selling</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    min={0}
                    onChange={(event) => field.onChange(+event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Price of 1 unit of selling in terms of buying
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder=""
                    type="number"
                    min={0}
                    {...field}
                    onChange={(event) => field.onChange(+event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {xdr ? (
            <Button
              onClick={() => {
                setSubmitLoading(true);
                clientsign({
                  presignedxdr: xdr,
                  pubkey: session.data?.user.id,
                  walletType: session.data?.user.walletType,
                  test: clientSelect(),
                })
                  .then((res) => {
                    if (res) {
                      toast.success("Offer set properly");
                    } else {
                      toast.error("Transaction Failed");
                    }
                  })
                  .catch((e) => console.log(e))
                  .finally(() => setSubmitLoading(false));
              }}
              disabled={submitLoading}
            >
              {submitLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          ) : (
            <Button type="submit" disabled={xdrMutation.isLoading}>
              {xdrMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Procced
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}
