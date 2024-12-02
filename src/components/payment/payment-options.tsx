import { useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "~/components/shadcn/ui/radio-group";
import { Label } from "~/components/shadcn/ui/label";
import { Coins, DollarSign, Loader2 } from "lucide-react";
import { CREATOR_TERM } from "~/utils/term";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

import { create } from "zustand";
import { env } from "~/env";
import { PaymentMethod, PaymentMethodEnum } from "../music/modal/buy_modal";

interface PaymentMethodStore {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const usePaymentMethodStore = create<PaymentMethodStore>((set) => ({
  paymentMethod: "asset",
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));

export interface CostBreakdownItem {
  label: string;
  amount: number;
  type: 'fee' | 'cost' | 'total' | 'subtotal';
  highlighted?: boolean;
}

export function PaymentChoose({
  XLM_EQUIVALENT,
  handleConfirm,
  loading,
  requiredToken,
  trigger,
  beforeTrigger,
  costBreakdown,
}: {
  requiredToken: number;
  XLM_EQUIVALENT: number;
  handleConfirm: () => void;
  loading: boolean;
  trigger: React.ReactNode;
  beforeTrigger?: () => Promise<boolean>;
  costBreakdown?: CostBreakdownItem[];
}) {
  const { paymentMethod, setPaymentMethod, isOpen, setIsOpen } =
    usePaymentMethodStore();

  function handleOpen(open: boolean): void {
    if (beforeTrigger) {
      beforeTrigger().then((result) => {
        if (result) {
          setIsOpen(open);
        }
      });
    } else {
      setIsOpen(open);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle className="mb-4 text-center text-2xl font-bold">
            Choose Payment Method
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
              <RadioGroupItem
                value={PaymentMethodEnum.enum.asset}
                id={PaymentMethodEnum.enum.asset}
                className="border-primary"
              />
              <Label
                htmlFor={PaymentMethodEnum.enum.asset}
                className="flex flex-1 cursor-pointer items-center"
              >
                <Coins className="mr-3 h-6 w-6 text-primary" />
                <div className="flex-grow">
                  <div className="font-medium">Pay with WADZZO</div>
                  <div className="text-sm text-gray-500">
                    Use platform tokens
                  </div>
                </div>
                <div className="text-right font-medium">
                  {requiredToken} WADZZO
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
              <RadioGroupItem
                value={PaymentMethodEnum.enum.xlm}
                id={PaymentMethodEnum.enum.xlm}
                className="border-primary"
              />
              <Label
                htmlFor={PaymentMethodEnum.enum.xlm}
                className="flex flex-1 cursor-pointer items-center"
              >
                <DollarSign className="mr-3 h-6 w-6 text-primary" />
                <div className="flex-grow">
                  <div className="font-medium">Pay with XLM</div>
                  <div className="text-sm text-gray-500">
                    Use Stellar Lumens
                  </div>
                </div>
                <div className="text-right font-medium">
                  {XLM_EQUIVALENT} XLM
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
          {costBreakdown ? costBreakdown.map((item, index) => (
            <div
              key={index}
              className={`flex justify-between ${item.highlighted ? 'font-semibold' : ''
                } ${item.type === 'total' ? 'text-lg pt-2 border-t border-gray-200' : 'text-sm'}`}
            >
              <span className={item.type === 'fee' ? 'text-gray-500' : ''}>
                {item.label}
              </span>
              <span>
                {item.amount} {paymentMethod === "asset" ? PLATFORM_ASSET.code : "XLM"}
              </span>
            </div>
          )) : <></>}
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Your account will be charged{" "}
          {paymentMethod === "asset"
            ? `${requiredToken} ${PLATFORM_ASSET.code}`
            : `${XLM_EQUIVALENT} XLM`}{" "}
          to perform this action.
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="mb-2 w-full"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
