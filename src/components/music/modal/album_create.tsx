import { api } from "~/utils/api";
import Modal, { ModalMode, ModalType } from "./modal_template";
import { ChangeEvent, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { generateHashIdFromName } from "~/utils/music/album";
import toast from "react-hot-toast";
import { Album } from "~/lib/music/types/dbTypes";
import Image from "next/image";

import _isEqual from "lodash/isEqual";
import { getAlbumCoverLocation } from "../album/utils";
import { useForm } from "react-hook-form";
import Alert from "~/components/ui/alert";

type AlbumCreate = {
  mode: ModalMode;
  album?: Album;
};
export default function AlbumCreate({ mode, album }: AlbumCreate) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({});
  // Define state variables to store the input values
  const [albumName, setAlbumName] = useState<string | undefined>(album?.name);
  const [description, setDescription] = useState<string | undefined>(
    album?.description,
  );

  const [file1, setFile1] = useState<File>();
  const { data: firebaseConfig } = api.firebase.getApp.useQuery(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [image, setImage] = useState<string | undefined>(album?.coverImgUrl);

  const utils = api.useContext();
  const mutation = api.album.create.useMutation({
    async onSuccess() {
      await utils.album.getAll.invalidate();
    },
  });

  // Function to handle changes in the album name input
  const handleAlbumNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAlbumName(e.target.value);
  };

  // Function to handle changes in the description input
  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const filechanged = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (file) {
      setFile1(file);
      setImage(URL.createObjectURL(file));
    }
  };

  async function updateAlbumFirebase() {
    // onupdate update function wll learn
    if (album) {
      // validation phase
      // check image have changed or not
      let imgUrl = album.coverImgUrl;
      if (file1 && firebaseConfig) {
        // toast("Image  changed");

        imgUrl = await uploadFileToFirstore(
          firebaseConfig,
          file1,
          getAlbumCoverLocation(album.id),
        );
      } else {
        // image have not changed
        // now check oter hav checked or not
        if (description && albumName) {
          const editedAlbum: Album = {
            coverImgUrl: album.coverImgUrl,
            description: description,
            id: album.id,
            name: albumName,
          };
          if (_isEqual(album, editedAlbum)) {
            // toast("All Same");
            return;
          } // just return no api call
        } else {
          toast.error("Album name or descripton is empty");
        }
      }

      // update hppened
      if (description && albumName) {
        if (description.length > 0 && albumName.length > 0)
          mutation.mutate({
            id: album.id,
            coverImgUrl: imgUrl,
            name: albumName,
            description: description,
            edit: true,
          });
      } else {
        toast.error("album name or descripton is empty");
      }
    } else {
      toast.error("You can't update album wth properId");
    }
  }

  async function createAlbumFirebase() {
    if (albumName) {
      const id = generateHashIdFromName(albumName);
      if (firebaseConfig && id) {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        // Initialize Cloud Firestore and get a reference to the service
        const storage = getStorage(app);

        if (file1) {
          // set uploading to true
          setIsUploading(true);

          const storageRef1 = ref(storage, getAlbumCoverLocation(id));
          await uploadBytes(storageRef1, file1);
          const url1 = await getDownloadURL(storageRef1);
          // end the uploading
          setIsUploading(false);

          if (description && albumName)
            mutation.mutate({
              id: id,
              coverImgUrl: url1,
              name: albumName,
              description: description,
              edit: false,
            });
        } else {
          toast.error("File is corrupted");
        }
      } else {
        toast.error("Firebase config problem");
      }
    } else {
      toast.error("Album name reuired");
    }
  }

  return (
    <Modal modalFor={ModalType.ALBUM} mode={mode} headerMessage="">
      {isUploading ? (
        <div>
          <progress className="progress w-56"></progress>
          <p>File is uploading</p>
        </div>
      ) : mutation.isLoading ? (
        <div>
          <progress className="progress w-56"></progress>
          <p>Album is adding</p>
        </div>
      ) : (
        <>
          {mutation.isError ? (
            <Alert
              type="error"
              content={`An error occurred: ${mutation.error.message}`}
            />
          ) : null}

          {mutation.isSuccess ? (
            <Alert type="success" content="Data mutation successfull" />
          ) : (
            <form
              onSubmit={
                mode == ModalMode.ADD
                  ? handleSubmit(createAlbumFirebase)
                  : handleSubmit(updateAlbumFirebase)
              }
            >
              <div className="flex flex-col gap-2">
                <input
                  value={albumName}
                  onChange={handleAlbumNameChange}
                  type="text"
                  required
                  placeholder="Album Name"
                  className="input input-bordered input-sm  w-full"
                />
                <input
                  value={description}
                  onChange={handleDescriptionChange}
                  type="text"
                  required
                  placeholder="Description"
                  className="input input-bordered input-sm w-full"
                />
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={filechanged}
                  className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                />
                {image && (
                  <Image
                    alt="preview image"
                    src={image}
                    width={200}
                    height={200}
                  />
                )}
              </div>
              <input className="btn btn-primary btn-sm mt-4" type="submit" />
            </form>
          )}
        </>
      )}
    </Modal>
  );
}
