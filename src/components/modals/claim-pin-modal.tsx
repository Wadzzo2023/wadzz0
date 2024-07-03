import QRCode from "react-qr-code";
import { useModal } from "../hooks/use-modal-store";
import CopyToClip from "../wallete/copy_to_Clip";
import { Button } from "../shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { useSession } from "next-auth/react";
import { addrShort } from "~/utils/utils";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import useNeedSign from "~/lib/hook";
import {
  CircleOff,
  Copy,
  LayersIcon,
  PinIcon,
  Scissors,
  ScissorsSquare,
  ShieldBan,
  ShieldCheck,
  ShieldMinus,
  Trash2,
} from "lucide-react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { set } from "date-fns";
import { clientSelect } from "~/lib/stellar/fan/utils";

import { clientsign } from "package/connect_wallet";

const ClaimPinModal = () => {
  const { onClose, isOpen, type, data } = useModal();
  const session = useSession();
  const { needSign } = useNeedSign();
  const [paymentSuccesfull, setpaymetSucess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasXdr, setHasXdr] = useState(false);

  const isModalOpen = isOpen && type === "claim pin";
  const handleClose = () => {
    setXdr(""); // Reset XDR state
    setpaymetSucess(false); // Reset payment success state
    xdrMutation.reset(); // Reset XDR mutation
    claimPin.reset(); // Reset claimPin mutation
    onClose();
  };
  const [xdr, setXdr] = useState<string>();

  const xdrMutation = api.maps.trx.getClaimXDR.useMutation({
    onSuccess: (data, Variable) => {
      setXdr(data);
      return;
    },
  });
  const claimPin = api.maps.pin.claimAPin.useMutation({
    onSuccess: () => {
      setpaymetSucess(true);
      toast.success("Claimed Successfully");
    },
  });

  async function handleXDR() {
    if (data?.location?.claimAmount) {
      await xdrMutation.mutateAsync({
        signWith: needSign(),
        locationId: data.location.id,
      });
    } else {
      toast("Not Claimable");
    }
  }

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              CLAIM PIN
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
            <div className="flex w-1/2 flex-col items-center">
              {xdr ? (
                <>
                  <Button
                    variant="destructive"
                    className=""
                    onClick={() => {
                      setLoading(true);
                      clientsign({
                        presignedxdr: xdr,
                        pubkey: session.data?.user.id,
                        walletType: session.data?.user.walletType,
                        test: clientSelect(),
                      })
                        .then(async (res) => {
                          if (res && data.locationConsumer?.id) {
                            await claimPin.mutateAsync({
                              id: data.locationConsumer?.id,
                            });
                            try {
                              await api
                                .useUtils()
                                .maps.pin.getConsumedLocated.invalidate();
                            } catch (e) {
                              console.log(e);
                            }
                          }
                        })
                        .catch((e) => console.log(e))
                        .finally(() => {
                          setLoading(false);

                          handleClose(); // Close the modal
                        });
                    }}
                    disabled={paymentSuccesfull}
                  >
                    {(loading || claimPin.isLoading) && (
                      <div>
                        <span className="loading  mr-2 h-3 w-3"></span>
                      </div>
                    )}
                    Confirm Claimant
                  </Button>
                </>
              ) : (
                <Button
                  disabled={xdrMutation.isSuccess}
                  className="w-full"
                  onClick={() => handleXDR()}
                >
                  {xdrMutation.isLoading && (
                    <div>
                      <span className="loading  mr-2 h-3 w-3"></span>
                    </div>
                  )}
                  Proceed
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className=" px-6 py-4"></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClaimPinModal;
