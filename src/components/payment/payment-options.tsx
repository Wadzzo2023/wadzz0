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
import { Coins, DollarSign } from "lucide-react";
import { CREATOR_TERM } from "~/utils/term";
import { PaymentMethods } from "~/pages/fans/creator";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";

export default function Component() {
  const [loading, setLoading] = useState(false);

  // Dummy data
  const CREATOR_TERM = "Brand";
  const requiredToken = 100;
  const PLATFORM_ASSET = { code: "WADZZO" };
  const XLM_EQUIVALENT = 250; // Dummy XLM equivalent

  const handleConfirm = () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      //   setIsOpen(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold">
          You are not a {CREATOR_TERM}
        </h2>
        <p className="mb-6 text-center text-gray-600">
          Your account will be charged {requiredToken} {PLATFORM_ASSET.code} or
          equivalent XLM to be a {CREATOR_TERM.toLowerCase()}.
        </p>

        <PaymentChoose
          requiredToken={requiredToken}
          XLM_EQUIVALENT={XLM_EQUIVALENT}
          handleConfirm={handleConfirm}
          loading={loading}
          trigger={
            <Button className="w-full">
              Join as a {CREATOR_TERM.toLowerCase()}
            </Button>
          }
        />
      </div>
    </div>
  );
}

/// create zustund store for paymentMethod

import { create } from "zustand";

interface PaymentMethodStore {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
}

export const usePaymentMethodStore = create<PaymentMethodStore>((set) => ({
  paymentMethod: PaymentMethods.PLATFORM,
  setPaymentMethod: (method) => set({ paymentMethod: method }),
}));

export function PaymentChoose({
  XLM_EQUIVALENT,
  handleConfirm,
  loading,
  requiredToken,
  trigger,
}: {
  requiredToken: number;
  XLM_EQUIVALENT: number;
  handleConfirm: () => void;
  loading: boolean;
  trigger: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { paymentMethod, setPaymentMethod } = usePaymentMethodStore();
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                value={PLATFORM_ASSET.code}
                id={PLATFORM_ASSET.code}
                className="border-primary"
              />
              <Label
                htmlFor={PLATFORM_ASSET.code}
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
                value={PaymentMethods.NATIVE}
                id={PaymentMethods.NATIVE}
                className="border-primary"
              />
              <Label
                htmlFor={PaymentMethods.NATIVE}
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
        <div className="mt-4 text-center text-sm text-gray-500">
          Your account will be charged{" "}
          {paymentMethod === "wadzzo"
            ? `${requiredToken} ${PLATFORM_ASSET.code}`
            : `${XLM_EQUIVALENT} XLM`}{" "}
          to be a {CREATOR_TERM.toLowerCase()}.
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
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
