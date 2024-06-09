"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Input } from "~/components/shadcn/ui/input";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "~/components/shadcn/ui/form";
import { Button } from "./shadcn/ui/button";
import { Label } from "./shadcn/ui/label";
import { Plus, ShieldPlus } from "lucide-react";

const formSchema = z.object({
  asset_code: z.string().min(1, {
    message: "Asset code Id is required.",
  }),
  limit: z.number().positive({
    message: "Limit must be greater than zero.",
  }),
  issuerId: z.string().min(1, {
    message: "IssuerId code is required.",
  }),
});

const onSubmit = async (values: z.infer<typeof formSchema>) => {
  console.log(values);
};

const AddTrustLine = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_code: "",
      issuerId: "",
      limit: "",
    },
  });
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
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase">
                    Trust Limit
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter Trust Limit..."
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
              name="issuerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase">
                    Issuer ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter Issuer ID..."
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
            <div className="flex items-center justify-end space-y-6">
              <Button variant="default" className="shrink-0 ">
                <Plus className="mr-2" size={20} />
                Add
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddTrustLine;
