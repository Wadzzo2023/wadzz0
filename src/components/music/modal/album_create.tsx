import { api } from "~/utils/api";
import Modal, { ModalMode, ModalType } from "./modal_template";
import { useState } from "react";

import Image from "next/image";

import _isEqual from "lodash.isequal";
import { SubmitHandler, useForm } from "react-hook-form";
import Alert from "~/components/ui/alert";
import { UploadButton } from "~/utils/uploadthing";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Album } from "@prisma/client";

type AlbumCreate = {
  mode: ModalMode;
  album?: Album;
};

export const AlbumFormShema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string(),
  coverImgUrl: z.string(),
});

type AlbumFormType = z.TypeOf<typeof AlbumFormShema>;

export default function AlbumCreate({ mode, album }: AlbumCreate) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof AlbumFormShema>>({
    resolver: zodResolver(AlbumFormShema),
    defaultValues: { ...album },
  });

  const [coverUrl, setCoverUrl] = useState<string | undefined>(
    album?.coverImgUrl,
  );

  const addAlbum = api.music.album.create.useMutation();
  const updateAlbum = api.music.album.update.useMutation();

  const onSubmit: SubmitHandler<z.infer<typeof AlbumFormShema>> = (data) => {
    if (album) {
      updateAlbum.mutate(data);
    } else {
      addAlbum.mutate(data);
    }
  };

  console.log(errors, "errors");

  return (
    <Modal modalFor={ModalType.ALBUM} mode={mode} headerMessage="">
      <>
        {addAlbum.isError ? (
          <Alert
            type="error"
            content={`An error occurred: ${addAlbum.error.message}`}
          />
        ) : null}

        {addAlbum.isSuccess ? (
          <Alert type="success" content="Album Added successfull" />
        ) : (
          <form
            onSubmit={
              mode == ModalMode.ADD
                ? handleSubmit(onSubmit)
                : handleSubmit(onSubmit)
            }
          >
            <div className="flex flex-col gap-2">
              <input
                {...register("name", { required: "Album name is required" })}
                type="text"
                required
                placeholder="Album Name"
                className="input input-bordered input-sm  w-full"
              />
              <input
                {...register("description", {
                  required: "Description is required",
                })}
                type="text"
                required
                placeholder="Description"
                className="input input-bordered input-sm w-full"
              />
              <UploadButton
                endpoint="imageUploader"
                content={{ button: "Add Media", allowedContent: "Max (4MB)" }}
                onClientUploadComplete={(res) => {
                  const data = res[0];
                  if (data?.url) {
                    setCoverUrl(data.url);
                    setValue("coverImgUrl", data.url);
                  }
                  // updateProfileMutation.mutate(res);
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  alert(`ERROR! ${error.message}`);
                }}
              />

              {coverUrl && (
                <Image
                  alt="preview image"
                  src={coverUrl}
                  width={200}
                  height={200}
                />
              )}
            </div>
            <input className="btn btn-primary btn-sm mt-4" type="submit" />
          </form>
        )}
      </>
    </Modal>
  );
}
