import { ChangeEvent, useState } from "react";
import isEmpty from "lodash/isEmpty";
import Modal, { ModalMode, ModalType } from "./modal_template";
import { api } from "~/utils/api";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { generateHashIdFromName } from "~/utils/album";
import { getSongCoverLocation, getSongSongLocation } from "../album/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import { Song, SongAsset, SongPrivacy } from "~/lib/types/dbTypes";
import { uploadFileToFirstore } from "~/lib/firebase/utils";
import { useForm, SubmitHandler } from "react-hook-form";
import { DEFAULT_COVER } from "~/utils/constants";
import { useConnectWalletStateStore } from "~/lib/states/connect_wallet_state";
import {
  firstTransection,
  trxResponse,
} from "~/lib/stellar/trx/create_song_token";
import clsx from "clsx";
import axios from "axios";
import { PinataResponse, pinFileToIPFS } from "~/lib/pinata/upload";
import {
  DEFAULT_ASSET_LIMIT,
  DEFAULT_ASSET_PRICE,
} from "~/lib/stellar/wallete/constant";
import { ErrorAlert } from "../alert/error";
import { SuccessAlert } from "../alert/success";
import { WarningAlert } from "../alert/warning";
import { limit } from "firebase/firestore";
import log from "~/lib/logger/logger";

type SongCreateProps = {
  albumId: string;
  mode: ModalMode;
  song?: Song;
};

type Inputs = {
  artist: string;
  description: string;
  assetCode: string;
  limit: string;
  price: string;
};

export default function SongCreate({ albumId, mode, song }: SongCreateProps) {
  const [file1, setFile1] = useState<File>();
  const [file2, setFile2] = useState<File>();
  const [privacyState, setPrivacy] = useState(song?.privacy);
  const [isUploading, setIsUploading] = useState(false);
  const [image, setImage] = useState(song?.coverImgUrl);
  const [audioLink, setAudioLink] = useState(song?.musicUrl);
  const { pubkey, walletType } = useConnectWalletStateStore();
  const [trxdata, setTrxdata] = useState<trxResponse>();
  const [loading, setLoading] = useState<boolean>(false);
  const [ipfsHash, setIpfsHash] = useState<PinataResponse>();

  const [code, setCode] = useState(song?.songAsset?.code);
  const [codeError, setCodeError] = useState<string>();

  const [songName, setName] = useState(song?.name);
  const [nameError, setNameError] = useState(() => {
    if (!songName) {
      return "Name is required";
    }
  });
  const utils = api.useContext();

  const { data: firebaseConfig } = api.firebase.getApp.useQuery(undefined);
  const mutation = api.song.create.useMutation({
    async onSuccess() {
      await utils.song.getAllSong.invalidate();
    },
  });
  // const assetCreateMutation = api.steller.generateMusicAsset.useMutation({
  //   onSuccess(data, variables, context) {
  //     log.info("data", data);
  //     setTrxdata(data);
  //   },
  // });

  const { data: secrets } = api.steller.getSecrets.useQuery();

  const albumIdIdx = albumId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    trigger,
    watch,
    setError,
    clearErrors,
    getValues,
  } = useForm<Inputs>({
    defaultValues: {
      artist: song?.artist,
      description: song?.songAsset?.description,
      price: song?.songAsset?.price,
    },
  });

  const filechanged = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (file) {
      setFile1(file);
      setImage(URL.createObjectURL(file));
    }
  };

  // Function to upload the selected file to Pinata

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const musicchanged = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    log.info("musiced changed");
    if (file) {
      setFile2(file);
      setAudioLink(URL.createObjectURL(file));
    }
  };

  const onUpdate: SubmitHandler<Inputs> = async ({
    artist,
    description,
    price,
    limit,
  }) => {
    if (song) {
      // requird filed name

      if (songName && isEmpty(songName)) {
        toast.error("Name can't be empty");
        if (songName.length < 3)
          setNameError("Name length have to be more than 2");
        return;
      }
      // check the two object have to changed a bit
      if (!file1 && !file2) {
        // toast("file have not changed");
      }

      // atleast one field have changed
      // writeen Cases,
      // determine which field get changed, just update this value in the mutation data.
      let imgUrl = song.coverImgUrl;
      let musicUrl = song.musicUrl;
      let duration = song.duration;

      // 1. if file chane
      if (file1 && firebaseConfig && song.id) {
        // file 1 changed. have to upload new file and get  url
        imgUrl = await uploadFileToFirstore(
          firebaseConfig,
          file1,
          getSongCoverLocation(albumIdIdx, song.id),
        );
      }
      if (file2 && firebaseConfig && song.id) {
        // file 2 changed. have to upload new file and get  url
        musicUrl = await uploadFileToFirstore(
          firebaseConfig,
          file2,
          getSongSongLocation(albumIdIdx, song.id),
        );
        duration = "3:21";
      }

      // 2. if string data change
      // Privacy

      let selctedPrivacyOption = privacyState
        ? privacyState
        : SongPrivacy.DRAFT;

      let songAsset = song.songAsset;

      if (privacyState == SongPrivacy.RESTRICTED) {
        if (songAsset) {
          // songAsset already created
          // only price of asset can be updated
          songAsset.price = validatePrice(price);
        } else {
          // create new assets
          selctedPrivacyOption = SongPrivacy.DRAFT;
          if (trxdata) {
            if (trxdata.successful) {
              //token created.
              // validate token input
              const assetprice = validatePrice(price);
              const llimit = validateLimit(limit).toString(); // limit bondery
              songAsset = {
                code: code!, // if trxdata is here thats mean code is not undefined
                description: description,
                distributor: trxdata.distributorSecret,
                issuer: trxdata.issuerAcc,
                limit: llimit,
                price: assetprice,
                ipfs: trxdata.ipfsHash,
              };

              selctedPrivacyOption = SongPrivacy.RESTRICTED;
            } else {
              toast.error("Transection was not successfull");
            }
          } else {
            toast.error("Asset was not created. so privacy is draft");
          }
        }
      }

      // toast(privacyState ? privacyState : "x", selectedPrivacyOption);
      // set default value of the other field
      const songArtist = !artist || isEmpty(artist) ? "Unknown Artist" : artist;

      mutation.mutate({
        albumId: albumIdIdx,
        artist: songArtist,
        coverImgUrl: imgUrl,
        id: song.id,
        musicUrl: musicUrl,
        name: songName!, // songname is no empty here
        duration: duration,
        edit: true,
        asset: songAsset,
        privacy: selctedPrivacyOption,
      });
    } else {
      toast.error("Song Id undefined");
    }
  };
  const onAdd: SubmitHandler<Inputs> = async ({
    artist,
    description,
    limit,
    price,
  }) => {
    if (songName && songName.length > 2) {
      const id = generateHashIdFromName(`${songName}and${albumIdIdx}`);

      if (firebaseConfig) {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        // Initialize Cloud Firestore and get a reference to the service
        const storage = getStorage(app);

        let url2: string;
        let url1 = DEFAULT_COVER;

        if (file1 && file2) {
          setIsUploading(true);
          // upload the cover to the pinata

          // music file
          const storageRef2 = ref(storage, getSongSongLocation(albumIdIdx, id));
          await uploadBytes(storageRef2, file2);
          url2 = await getDownloadURL(storageRef2);

          // cover file
          const storageRef1 = ref(
            storage,
            getSongCoverLocation(albumIdIdx, id),
          );
          await uploadBytes(storageRef1, file1);
          url1 = await getDownloadURL(storageRef1);

          // end the uploading
          setIsUploading(false);
        } else {
          toast.error("Problem in music cover or music file");
          return;
        }

        // set default value of the other field

        // const { selectedPrivacyOption, assetWithIssuer } =
        //   getValidatedPrivacyOption(assetCode, issuer, song);

        let selctedPrivacyOption = privacyState
          ? privacyState
          : SongPrivacy.DRAFT;
        let songAsset: SongAsset;
        if (privacyState == SongPrivacy.RESTRICTED) {
          selctedPrivacyOption = SongPrivacy.DRAFT;
          // generate nft
          if (trxdata) {
            if (trxdata.successful) {
              // token created.
              const assetprice = validatePrice(price);
              const llimit = validateLimit(limit).toString(); // limit bondery
              songAsset = {
                code: code!, // if trxdata is here thats mean code is not undefined
                description: description,
                distributor: trxdata.distributorSecret,
                issuer: trxdata.issuerAcc,
                limit: llimit,
                price: assetprice,
                ipfs: trxdata.ipfsHash,
              };

              // set privacy to
              selctedPrivacyOption = SongPrivacy.RESTRICTED;
            } else {
              toast(
                "Asset creation failed, this song will be saved as DRAFT privacy",
              );
            }
          } else {
            toast.error("Asset was not created. so privacy is draft");
          }
        }

        const songArtist =
          !artist || isEmpty(artist) ? "Unknown Artist" : artist;

        mutation.mutate({
          albumId: albumIdIdx,
          artist: songArtist,
          coverImgUrl: url1,
          id: id,
          musicUrl: url2,
          asset: songAsset,
          name: songName,
          duration: "0:0",
          edit: false,
          privacy: selctedPrivacyOption,
        });
      } else {
        toast.error("firebase config problem");
      }
    } else {
      toast.error("Music name problem, Id could not generated");
      setName("Name length have to be more than 2");
    }

    log.info(isEmpty(description));
  };

  function onOptionChanged(event: ChangeEvent<HTMLSelectElement>): void {
    const privacy = event.currentTarget.value as SongPrivacy;
    setPrivacy(privacy);
  }

  function validatePrice(price: string) {
    let validatedPrice = DEFAULT_ASSET_PRICE;
    if (!isEmpty(price)) {
      const numberValaue = Number(price);
      if (!isNaN(numberValaue) && numberValaue > 0) {
        validatedPrice = price;
      }
    }

    return validatedPrice;
  }

  function validateLimit(l: string) {
    let llimit = 1; // limit bondery default
    if (!isEmpty(l)) {
      const numberValue = Number(l);
      if (!isNaN(numberValue) && numberValue > 0) {
        llimit = Math.floor(numberValue);
      }
    }
    return llimit;
  }

  async function handleTokenCreate() {
    // assetCreateMutation.reset();
    if (file1 && songName) {
      const l = getValues("limit");

      if (code) {
        if (code.length < 2 || code.length > 12) {
          setCodeError("Asset code should be beetween 2 to 12 charecter");
        } else {
          // llimit validation

          const llimit = validateLimit(l);
          const err: trxResponse = {
            ipfsHash: "",
            distributorSecret: "",
            successful: false,
            issuerAcc: { pub: "", secret: "" },
            error: { status: 504, msg: "Unexpected error happens" },
          };

          setCodeError(undefined);
          setLoading(true);

          // pinata file upload
          const ipfsRes = await pinFileToIPFS({ file: file1, name: songName });
          if (ipfsRes === false) {
            toast.error("Problem with uploading to pinata");
            setLoading(false);
            return;
          } else {
            setIpfsHash(ipfsRes);

            if (secrets) {
              const res = await firstTransection({
                assetCode: code,
                nftLimit: llimit,
                motherSecret: secrets.MOTHER_SECRET,
                storageSecret: secrets.STORAGE_SECRET,
                ipfsHash: ipfsRes.IpfsHash,
              });
              if (res) {
                setTrxdata(res);
              } else {
                setTrxdata(err);
              }
            }
          }
          setLoading(false);
          // assetCreateMutation.mutate({ code: code, limit: llimit, pubkey });
        }
      } else {
        setCodeError("Asset Code is required");
      }
    } else {
      toast.error("While creating NFT, cover should be reuploaded for ipfs");
    }
  }

  function conditonalError() {
    if (trxdata && trxdata?.successful) {
      return (
        <label className="label my-2">
          <SuccessAlert message="Music Asset Created" />
        </label>
      );
    } else {
      return (
        <>
          <label className="label my-2">
            {
              trxdata?.error && !loading && (
                <ErrorAlert
                  message={`${trxdata.error.msg} status: ${trxdata.error.status}`}
                />
              )
              // : (
              //   <ErrorAlert message="Unexpected error happended. try again" />
              // )
            }
          </label>
        </>
      );
    }
  }
  function conditionalAssetCreateButton() {
    if (!trxdata?.successful)
      return (
        <div className="my-2">
          {!song || (song && !song.songAsset) ? (
            loading ? (
              <span className="loading loading-infinity loading-lg text-primary"></span>
            ) : (
              <div
                className="btn btn-primary btn-sm "
                onClick={handleTokenCreate}
              >
                Create Token
              </div>
            )
          ) : null}
        </div>
      );
  }

  return (
    <Modal
      modalFor={ModalType.SONG}
      mode={mode}
      headerMessage="To make your track avaiable to user, you need to set privacy, asset, isssuer field carefully"
      // handleSaveClick={mode == ModalMode.ADD ? createSong : updateSong}
      handleSaveClick={() => mutation.reset()}
    >
      {isUploading ? (
        <div>
          <progress className="progress w-56"></progress>
          <p>File is uploading</p>
        </div>
      ) : (
        <>
          {mutation.isLoading ? (
            <div>
              <progress className="progress w-56"></progress>
              <p>Mutation is happening</p>
            </div>
          ) : (
            <>
              {mutation.isSuccess ? (
                <SuccessAlert message="Data mutation successfull" />
              ) : (
                <form
                  onSubmit={
                    mode == ModalMode.ADD
                      ? handleSubmit(onAdd)
                      : handleSubmit(onUpdate)
                  }
                >
                  <div className="flex flex-col gap-4">
                    <div className="rounded-md bg-base-200 p-2">
                      <div className="rounded-md bg-base-200 p-2">
                        <label className="label font-bold">Song Info</label>
                        <div className="w-full max-w-xs">
                          <label className="label">Name</label>
                          <input
                            minLength={2}
                            required
                            value={songName}
                            onChange={(e) => {
                              setName(e.currentTarget.value);
                              if (songName) {
                                if (songName?.length < 3) {
                                  setNameError(
                                    "Name length have to be more than 2",
                                  );
                                } else {
                                  setNameError(undefined);
                                }
                              }
                            }}
                            className="input input-bordered input-sm  w-full"
                            placeholder="Enter Music Name"
                          />
                          {nameError && (
                            <label className="label">
                              <span className="label-text-alt text-warning">
                                {nameError}
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="w-full max-w-xs">
                          <label className="label">Artist</label>
                          <input
                            {...register("artist")}
                            className="input input-bordered input-sm  w-full"
                            placeholder="Enter Artist Name"
                          />
                        </div>
                      </div>
                      <label className="label font-bold">Upload Files</label>
                      <div className="form-control w-full max-w-xs">
                        <label className="label">
                          <span className="label-text">
                            Choose a thumbnail. (this will be used as NFT Image)
                          </span>
                        </label>

                        {mode == ModalMode.ADD ? (
                          <input
                            required
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={filechanged}
                            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                          />
                        ) : (
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={filechanged}
                            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                          />
                        )}
                        {image && (
                          <>
                            <Image
                              className="p-2"
                              width={120}
                              height={120}
                              alt="preview image"
                              src={image}
                            />
                          </>
                        )}
                      </div>
                      <div className="form-control w-full max-w-xs">
                        <label className="label">
                          <span className="label-text">
                            Choose your music (required)
                          </span>
                        </label>

                        {mode == ModalMode.ADD ? (
                          <input
                            onChange={musicchanged}
                            accept="audio/mpeg"
                            type="file"
                            className="file-input file-input-bordered  file-input-sm w-full max-w-xs"
                            required
                          />
                        ) : (
                          <input
                            onChange={musicchanged}
                            accept="audio/mpeg"
                            type="file"
                            className="file-input file-input-bordered  file-input-sm w-full max-w-xs"
                          />
                        )}

                        {audioLink && (
                          <>
                            <audio controls className="py-2">
                              <source src={audioLink} type="audio/mpeg" />
                            </audio>
                            {/* <AudioPlayer src={audioLink} /> */}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-full max-w-xs">
                      <label className="label">Choose Song privacy type</label>
                      <select
                        className="select select-bordered select-sm w-full max-w-xs"
                        onChange={onOptionChanged}
                        value={privacyState}
                      >
                        {Object.values(SongPrivacy).map((privacy) => (
                          <option key={privacy} value={privacy}>
                            {privacy}
                          </option>
                        ))}
                      </select>
                    </div>

                    {privacyState == SongPrivacy.RESTRICTED && (
                      <>
                        <div className="rounded-md bg-base-200 p-2">
                          <label className="label  font-bold">NFT Info</label>
                          {song?.songAsset ? (
                            <div>
                              <p>{song.songAsset.code}</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-full max-w-xs ">
                                <label className="label">
                                  <span className="label-text">Asset Name</span>
                                  <span className="label-text-alt">
                                    You can&apos;t change it later
                                  </span>
                                </label>
                                <input
                                  disabled={trxdata?.successful ? true : false}
                                  value={code}
                                  onChange={(e) => setCode(e.target.value)}
                                  className={clsx(
                                    "input input-bordered input-sm  w-full",
                                    codeError && "input-warning",
                                  )}
                                  placeholder="Enter Asset Name"
                                />
                                {codeError && (
                                  <label className="label">
                                    <span className="label-text-alt text-warning">
                                      {codeError}
                                    </span>
                                  </label>
                                )}
                              </div>
                              <div className=" w-full max-w-xs ">
                                <label className="label">
                                  <span className="label-text">Limit</span>
                                  <span className="label-text-alt">
                                    Default limit would be 1
                                  </span>
                                </label>
                                <input
                                  disabled={trxdata?.successful ? true : false}
                                  type="number"
                                  {...register("limit")}
                                  className="input input-bordered input-sm  w-full"
                                  placeholder="Enter limit of the new Asset"
                                />
                              </div>
                            </>
                          )}
                          <div className="w-full max-w-xs">
                            <label className="label">
                              <span className="label-text">Price</span>
                              <span className="label-text-alt">
                                Default price is 2XLM
                              </span>
                            </label>
                            <input
                              step="0.1"
                              type="number"
                              {...register("price")}
                              className="input input-bordered input-sm  w-full"
                              placeholder="Price"
                            />
                          </div>

                          <div className="w-full max-w-xs">
                            <label className="label">Description</label>
                            <input
                              {...register("description")}
                              className="input input-bordered input-sm  w-full"
                              placeholder="Write a short Description"
                            />
                          </div>

                          {/* <WarningAlert message="Some alert lorem20 fdjaf dlkdjfsldkf ksdfjas;dfk sj;ldkf lsjkfdal;sd f kjfs;dlf  akj" /> */}
                          {conditonalError()}
                          {conditionalAssetCreateButton()}
                        </div>
                      </>
                    )}
                  </div>
                  {/* {assetCreateMutation.isError && (
                    <ErrorAlert message={assetCreateMutation.error.message} />
                  )} */}

                  <input
                    className="btn btn-primary btn-sm mt-4"
                    type="submit"
                    disabled={loading}
                  />
                </form>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
}
