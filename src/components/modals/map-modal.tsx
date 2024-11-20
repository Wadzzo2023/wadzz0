import {
  CheckCheck,
  Copy,
  Edit3,
  InfoIcon,
  Loader2,
  Scissors,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { api } from "~/utils/api";
import { ModalData, useModal } from "../../lib/state/play/use-modal-store";

import { Input } from "~/components/shadcn/ui/input";
import { UploadButton } from "~/utils/uploadthing";
import { useRouter } from "next/router";
import { IPin, useMapModalStore } from "~/pages/maps";
import { Loader } from "@react-three/drei";

const MapModalComponent = () => {
  const {
    isOpen,
    onClose,
    type,
    data,
    isPinCopied,
    setIsPinCopied,
    isAutoCollect,
    setIsPinCut,
  } = useModal();
  const [isForm, setIsForm] = React.useState(false);
  // console.log(data.long, data.lat, data.pinId);
  const session = useSession();
  const router = useRouter();

  const { setManual, setDuplicate, setPosition, setIsOpen, setPrevData } =
    useMapModalStore();
  const isModalOpen = isOpen && type === "map";
  const handleClose = () => {
    onClose();
  };

  const pinM = api.maps.pin.getPinM.useMutation({
    onSuccess: (data) => {
      setPrevData(data as IPin);
      handleDuplicatePin();

      toast.success("Pin duplicated successfully");
    },
  });

  // const []= useState()

  const ToggleAutoCollectMutation = api.maps.pin.toggleAutoCollect.useMutation({
    onSuccess: (data) => {
      toast.success("Auto collect disabled successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleAutoCollect = async (pinId: string | undefined) => {
    if (pinId) {
      // console.log(pinId);
      if (isAutoCollect) {
        ToggleAutoCollectMutation.mutate({
          id: pinId,
          isAutoCollect: false,
        });
      } else {
        ToggleAutoCollectMutation.mutate({
          id: pinId,
          isAutoCollect: true,
        });
      }
    } else {
      toast.error("Pin Id not found");
    }
  };

  const handleCopyPin = () => {
    if (data?.pinId) {
      // console.log("handleCopyPin", data?.pinId);
      toast.success("Pin Id copied to clipboard");
      setIsPinCopied(true);
    } else {
      toast.error("Pin Id not found");
    }
  };

  const DeletePin = api.maps.pin.deletePin.useMutation({
    onSuccess: (data) => {
      if (data.item) {
        toast.success("Pin deleted successfully");
        handleClose();
      } else {
        toast.error(
          "Pin not found or You are not authorized to delete this pin",
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
      console.log(error);
    },
  });
  const handleDelete = () => {
    if (data?.pinId) {
      DeletePin.mutate({ id: data?.pinId });
      // console.log("handleDelete", data?.pinId);
      toast.success("Pin deleted successfully");
      handleClose();
    } else {
      toast.error("Pin Id not found");
    }
  };

  const handleCutPin = () => {
    if (data?.pinId) {
      // console.log("handleCutPin", data?.pinId);
      toast.success("Pin Id copied to clipboard");
      setIsPinCut(true);
    } else {
      toast.error("Pin Id not found");
    }
  };

  if (!session?.data?.user?.id) {
    return <div>Public Key not found</div>;
  }
  function handleDuplicatePin(): void {
    handleClose();
    setManual(true);
    setDuplicate(true);
    setIsOpen(true);
  }

  if (data)
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="overflow-hidden p-0">
            <>
              <DialogHeader className="px-6 pt-8">
                <DialogTitle className="flex items-center justify-center gap-2  ">
                  <h2 className="text-center text-2xl font-bold">
                    {data?.mapTitle}{" "}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsForm(!isForm)}
                  >
                    <Edit3 />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {isForm && data.pinId ? (
                <PinInfoUpdate
                  id={data.pinId}
                  image={data.image}
                  description={data.mapDescription ?? "Description"}
                  title={data.mapTitle ?? "No Title"}
                />
              ) : (
                <PinInfo data={data} />
              )}
            </>
            <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
              <Button className="m-1 w-1/2 " onClick={handleCutPin}>
                <Scissors size={15} className="mr-2" /> Cut Pin
              </Button>
              <Button className="m-1 w-1/2 " onClick={handleCopyPin}>
                <Copy size={15} className="mr-2" /> Copy Pin
              </Button>
              <Button
                className="m-1 w-1/2 "
                onClick={() => {
                  data.pinId && pinM.mutate(data.pinId);
                }}
              >
                {pinM.isLoading ? (
                  <Loader2 className="animate animate-spin" />
                ) : (
                  <Copy size={15} className="mr-2" />
                )}{" "}
                Duplicate pins
              </Button>
              <Button
                className="m-1 w-1/2 "
                onClick={() => {
                  router
                    .push(`maps/pins/${data.pinId}`)
                    .finally(() => handleClose());
                }}
              >
                <InfoIcon size={15} className="mr-2" /> Show collectors
              </Button>
              {isAutoCollect ? (
                <Button
                  className="m-1 w-1/2 "
                  onClick={() => handleToggleAutoCollect(data.pinId)}
                >
                  <ShieldCheck size={15} className="mr-2" /> Disable Auto
                  Collect
                </Button>
              ) : (
                <Button
                  className="m-1 w-1/2 "
                  onClick={() => handleToggleAutoCollect(data.pinId)}
                >
                  <ShieldBan size={15} className="mr-1" /> Enable Auto Collect
                </Button>
              )}
              <Button className="m-1 w-1/2 " onClick={handleDelete}>
                <Trash2 size={15} className="mr-2" /> Delete Pin
              </Button>
            </div>
            <DialogFooter className=" px-6 py-4"></DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
};
export default MapModalComponent;

function PinInfo({
  data,
}: {
  data: {
    mapDescription?: string | null;
    long?: number;
    lat?: number;
    image?: string;
  };
}) {
  return (
    <div className="flex flex-col items-center">
      {data.mapDescription && (
        <div className="text-sm">{data.mapDescription}</div>
      )}
      <div>Long: {data.long}</div>
      <div>Lat: {data.lat}</div>
      <div className="flex justify-center">
        {data.image && (
          <Image
            src={data.image}
            alt="image"
            width={200}
            height={200}
            className="rounded-lg"
          />
        )}
      </div>
    </div>
  );
}

function PinInfoUpdate({
  image,
  description,
  title,
  id,
}: {
  image?: string;
  title: string;
  description: string;
  id: string;
}) {
  const [coverUrl, setCover] = React.useState(image);
  const [titleE, setTitle] = React.useState(title);
  const [descriptionE, setDescription] = React.useState(description);
  const { data, updateData } = useModal();

  const utils = api.useUtils();

  const update = api.maps.pin.updatePin.useMutation({
    onSuccess: async () => {
      // toast.success("Pin updated successfully");
      updateData({
        ...data,
        mapTitle: titleE,
        mapDescription: descriptionE,
        image: coverUrl,
      });

      await utils.maps.pin.getMyPins.refetch();
    },
  });

  return (
    <div className="m-auto max-w-sm rounded bg-slate-200 p-3">
      <Input
        className="mb-2"
        placeholder="Edit Title"
        value={titleE}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        className="mb-2"
        placeholder="Edit Description"
        value={descriptionE}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="mt ">
        <UploadButton
          endpoint="imageUploader"
          content={{
            button: "Add Cover",
            allowedContent: "Max (4MB)",
          }}
          onClientUploadComplete={(res) => {
            const data = res[0];

            if (data?.url) {
              setCover(data.url);
            }
          }}
          onUploadError={(error: Error) => {
            alert(`ERROR! ${error.message}`);
          }}
        />

        {coverUrl && (
          <>
            <Image
              className="p-2"
              width={120}
              height={120}
              alt="preview image"
              src={coverUrl}
            />
          </>
        )}
      </div>

      <Button
        disabled={update.isLoading || update.isSuccess}
        className="m-1 w-full"
        onClick={() => {
          update.mutate({
            pinId: id,
            title: titleE,
            description: descriptionE,
            imgUrl: coverUrl,
          });
        }}
      >
        {update.isLoading && <Loader2 className="animate-spin" />}
        {update.isSuccess && <CheckCheck className="mr-2" />} Update
      </Button>
    </div>
  );
}
