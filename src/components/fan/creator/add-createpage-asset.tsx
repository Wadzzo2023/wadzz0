import { Creator } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import Loading from "~/components/wallete/loading";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { api } from "~/utils/api";
import Alert from "../../ui/alert";
import NewPageAssetFrom from "./page_asset/new";
import CustomPageAssetFrom from "./page_asset/custom";
import clsx from "clsx";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";

export default function AddCreatorPageAssetModal({
  creator,
}: {
  creator: Creator;
}) {
  const { platformAssetBalance } = useUserStellarAcc();

  const requiredToken = api.fan.trx.getPlatformTokenPriceForXLM.useQuery({
    xlm: 2,
  });

  if (requiredToken.isLoading) return <Loading />;

  if (requiredToken.data) {
    if (platformAssetBalance < requiredToken.data) {
      return (
        <Alert
          className="max-w-lg"
          type={"error"}
          content={`To create this page asset, you'll need ${requiredToken.data} ${PLATFROM_ASSET.code} for your Asset account.`}
        />
      );
    } else {
      return (
        <AddCreatorPageAssetModalFrom
          requiredToken={requiredToken.data}
          creator={creator}
        />
      );
    }
  }
}

function AddCreatorPageAssetModalFrom({
  creator,
  requiredToken,
}: {
  creator: Creator;
  requiredToken: number;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const handleModal = () => {
    modalRef.current?.showModal();
  };
  const [isNew, setNetAsset] = useState(true);

  return (
    <>
      <button className="btn  btn-primary" onClick={handleModal}>
        <Plus />
        Add Page Asset
      </button>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="mb-4 text-center text-lg font-bold">
            Create Page Asset
          </h3>
          <PageAssetTab />

          <div className="w-full">
            {isNew ? (
              <NewPageAssetFrom requiredToken={requiredToken} />
            ) : (
              <CustomPageAssetFrom requiredToken={requiredToken} />
            )}
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
  function PageAssetTab() {
    return (
      <div role="tablist" className="tabs-boxed tabs">
        <a
          role="tab"
          onClick={() => setNetAsset(true)}
          className={clsx("tab", isNew && "tab-active")}
        >
          New
        </a>
        <a
          role="tab"
          onClick={() => setNetAsset(false)}
          className={clsx("tab", !isNew && "tab-active")}
        >
          Custom
        </a>
      </div>
    );
  }
}
