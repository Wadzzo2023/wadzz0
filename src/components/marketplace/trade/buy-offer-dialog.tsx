import { Loader2, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { clientsign } from "package/connect_wallet";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { match } from "ts-pattern";
import { z } from "zod";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import useNeedSign from "~/lib/hook";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { api } from "~/utils/api";
import { loading, success } from "~/utils/trcp/patterns";
import { addrShort } from "~/utils/utils";

export default function BuyOfferDialog({
  offerId,
}: {
  offerId: string | number;
}) {
  const [xdr, setXDR] = useState<string>();
  const [signLoading, setSignLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const session = useSession();
  const { needSign } = useNeedSign();

  // query
  const offer = api.marketplace.trade.getOffer.useQuery(offerId.toString());

  // mutation
  const buyOfferXDRMutation = api.marketplace.trade.offerBuyXDR.useMutation({
    onSuccess: (data) => setXDR(data),
  });

  const offerC = match(offer)
    .with(loading, () => <div>Loading...</div>)
    .with(success, (data) => {
      const offer = data.data;
      if (offer)
        return (
          <div className="grid gap-1">
            <div className="text-lg font-semibold">OfferId: {offer.id}</div>
            <div className="text-sm text-muted-foreground">
              Seller : {addrShort(offer.seller, 4)}
            </div>
            <div className="text-sm text-muted-foreground">
              Selling Asset : {offer.selling.asset_code}
            </div>
            <div className="text-sm text-muted-foreground">
              Buying Asset: {offer.buying.asset_code}
            </div>
            <div className="text-sm text-muted-foreground">
              Price: {offer.price}
            </div>
          </div>
        );
    })
    .otherwise((data) => {
      return data.error?.message;
    });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
          <ShoppingBag size={14} className="mr-2" /> Buy offer
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Buy offer</DialogTitle>
          <DialogDescription>Offer Details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {offerC}

          {xdr ? (
            <Button
              variant="destructive"
              onClick={() => {
                setSignLoading(true);
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
                  .finally(() => setSignLoading(false));
              }}
            >
              {signLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" size={20} />
              )}
              Confirm
            </Button>
          ) : (
            <Button
              onClick={() => {
                buyOfferXDRMutation.mutate({
                  offerId: offerId.toString(),
                  signWith: needSign(),
                });
              }}
              variant="default"
              className="font-bold "
            >
              {buyOfferXDRMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" size={20} />
              )}
              Buy Offer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
