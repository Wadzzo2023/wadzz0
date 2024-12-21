import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { ReactNode, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Label } from "~/components/shadcn/ui/label";
import { Input } from "~/components/shadcn/ui/input";
import { Button } from "~/components/shadcn/ui/button";
import { Loader2, Pen } from "lucide-react";
import { MarketAssetType, useModal } from "~/lib/state/play/use-modal-store";
type PlaceMarketModalProps = {
  content: ReactNode;
  item: MarketAssetType;
};
export default function ViewMediaModal({
  item,
  content,
}: PlaceMarketModalProps) {
  const modal = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState(false);
  const { onOpen } = useModal();
  function handleClose() {
    modal.current?.close();
  }

  const handleModal = () => {
    modal.current?.showModal();
  };

  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box max-w-2xl">
          <form method="dialog p-2 mt-4">
            <button
              className="btn btn-circle btn-outline btn-sm absolute right-2 top-2 p-2 "
              onClick={() => handleClose()}
            >
              ✕
            </button>
          </form>
          <div
            onClick={() => onOpen("creator asset info", {
              creatorStoreAsset: item
            })}
          >
            {/* {!editing && <AssetDetails currentData={item} />} */}
            {/* <EditItem
              editing={editing}
              handleEdit={() => setEditing(!editing)}
              item={item}
              closeModal={handleClose} // Pass the closeModal function
            /> */}
          </div>


        </div>
      </dialog>

      <div onClick={() => handleModal()}>{content}</div>
    </>
  );
}

function EditItem({
  item,
  editing,
  handleEdit,
  closeModal,
}: {
  item: MarketAssetType;
  editing: boolean;
  handleEdit: () => void;
  closeModal: () => void;
}) {
  const session = useSession();

  if (session.status == "authenticated") {
    const user = session.data.user;
    if (user.id == item.asset.creatorId) {
      return (
        <div>
          {editing && <EditForm item={item} closeModal={closeModal} />}
          <div className="flex justify-end">
            <ToggleButton />
          </div>
        </div>
      );
    }
  }
  function ToggleButton() {
    return (
      <button className="btn-cirlce btn w-full m-2" onClick={handleEdit}>
        {editing ? "Cancel" : <span className="flex items-center gap-2">Edit <Pen size={15} /></span>}
      </button>
    );
  }
}

export const updateAssetFormShema = z.object({
  assetId: z.number(),
  price: z.number().nonnegative(),

  priceUSD: z.number().nonnegative(),
});

function EditForm({
  item,
  closeModal,
}: {
  item: MarketAssetType;
  closeModal: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof updateAssetFormShema>>({
    resolver: zodResolver(updateAssetFormShema),
    defaultValues: {
      assetId: item.id,
      price: item.price,
      priceUSD: item.priceUSD,
    },
  });

  // mutation
  const update = api.fan.asset.updateAsset.useMutation({
    onSuccess: (data) => {
      if (data) {
        closeModal();
      }
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof updateAssetFormShema>> = (
    data,
  ) => {
    update.mutate(data);
  };

  return (
    <Card className=" w-full ">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Edit Asset
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Price in {PLATFORM_ASSET.code}
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              className={`w-full ${errors.price ? "border-red-500" : ""}`}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceUSD" className="text-sm font-medium">
              Price in USD
            </Label>
            <Input
              id="priceUSD"
              type="number"
              step="0.01"
              {...register("priceUSD", { valueAsNumber: true })}
              className={`w-full ${errors.priceUSD ? "border-red-500" : ""}`}
            />
            {errors.priceUSD && (
              <p className="text-sm text-red-500">{errors.priceUSD.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full transform rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-purple-600"
            disabled={update.isLoading}
          >
            {update.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Asset"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
