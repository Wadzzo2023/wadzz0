import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { ReactNode, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import {
  AssetDetails,
  MarketAssetType,
} from "~/components/marketplace/market_right";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";

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

  function resetState() {
    // modal.current?.close();
  }

  const handleModal = () => {
    modal.current?.showModal();
  };

  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <div>
            {!editing && <AssetDetails currentData={item} />}
            <EditItem
              editing={editing}
              handleEdit={() => setEditing(!editing)}
              item={item}
            />
          </div>

          {/* <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => resetState()}>
                Close
              </button>
            </form>
          </div> */}
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
}: {
  item: MarketAssetType;
  editing: boolean;
  handleEdit: () => void;
}) {
  const session = useSession();

  if (session.status == "authenticated") {
    const user = session.data.user;
    if (user.id == item.asset.creatorId) {
      return (
        <div>
          {editing && <EditForm item={item} />}
          <div className="flex justify-end">
            <ToggleButton />
          </div>
        </div>
      );
    }
  }
  function ToggleButton() {
    return (
      <button className="btn-cirlce btn" onClick={handleEdit}>
        {editing ? "Cancel" : "Edit"}
      </button>
    );
  }
}

export const updateAssetFormShema = z.object({
  assetId: z.number(),
  price: z.number().min(1),

  priceUSD: z.number().min(1),
});

function EditForm({ item }: { item: MarketAssetType }) {
  const {
    register,
    getValues,
    handleSubmit,
    reset,
    control,
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
  const update = api.fan.asset.updateAsset.useMutation();

  const onSubmit: SubmitHandler<z.infer<typeof updateAssetFormShema>> = (
    data,
  ) => {
    // commentM.mutate(data);
    update.mutate(data);
  };

  console.log(item);

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control w-full ">
          <div className="label">
            <span className="label-text">Price in {PLATFROM_ASSET.code}</span>
          </div>
          <input
            type="number"
            {...register("price", { valueAsNumber: true })}
            className="input input-bordered w-full max-w-xs"
          />
          {errors.price && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.price.message}
              </span>
            </div>
          )}
        </label>
        <label className="form-control w-full ">
          <div className="label">
            <span className="label-text">Price in USD</span>
          </div>
          <input
            type="number"
            {...register("priceUSD", { valueAsNumber: true })}
            className="input input-bordered w-full max-w-xs"
          />
          {errors.priceUSD && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.priceUSD.message}
              </span>
            </div>
          )}
        </label>
        <button className="btn" type="submit">
          {update.isLoading && <span className="loading loading-spinner" />}
          Submit
        </button>
      </form>
    </div>
  );
}
