import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import CopyToClip from "~/components/wallete/copy_to_Clip";
import { addrShort } from "~/utils/utils";

const ReceiveCustomAssetModal = ({
  asset,
  issuer,
  pubkey,
}: {
  pubkey: string;
  asset: string;
  issuer: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus />
          </Button>
        </DialogTrigger>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              RECEIVE ASSETS
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
            <h6 className="p-1 text-[10px] md:text-xs ">{asset}</h6>
            <h6 className="p-1 text-[10px] md:text-xs ">
              Issuer: {addrShort(issuer, 10)}
              <CopyToClip text={issuer} collapse={5} />
            </h6>
            Send the above asset to the following address
            <h6 className="p-1 text-[10px] md:text-xs ">
              {addrShort(pubkey, 10)}
            </h6>
            <CopyToClip text={pubkey} collapse={5} />
          </div>
          <DialogFooter className="px-6 py-4"></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ReceiveCustomAssetModal;
