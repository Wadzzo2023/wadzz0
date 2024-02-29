import { initializeApp } from "firebase/app";
import isEmpty from "lodash.isEmpty";
import { ChangeEvent, useEffect, useState } from "react";
import { api } from "~/utils/api";
import Modal, { ModalMode, ModalType } from "./modal_template";

import clsx from "clsx";
import Image from "next/image";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { env } from "~/env";
import log from "~/lib/logger/logger";
// import { PinataResponse } from "~/lib/pinata/upload";
import { useConnectWalletStateStore } from "package/connect_wallet";
import { DEFAULT_ASSET_PRICE } from "~/lib/stellar/marketplace/constant";
import {
  firstTransection,
  trxResponse,
} from "~/lib/stellar/marketplace/trx/create_song_token";
import { NFTAsset, NFTPrivacy, NFTType } from "~/lib/types/dbTypes";
import { MarketNFT } from "~/server/api/routers/marketplace";
import { uid } from "~/utils/utils";
import { ErrorAlert } from "../alert/error";
import { SuccessAlert } from "../alert/success";
import {
  DEFAULT_COVER,
  getNftMediaLocation,
  getNftThumbnailLocation,
} from "../nfts/utils";

export type NFTCreateProps = {
  mode: ModalMode;
  nft?: MarketNFT;
};

type Inputs = {
  description: string;
  assetCode: string;
  limit: string;
};

/*
Section 1
- An item name (This will be default item name to be listed on marketplace)
- A short description of digital content inside
- Upload item (Actual digital content mp3,mp4,png,jpeg, webp, webm, gif)
- Price per item (on siteAsset token)
- Quantity of mint
Section 2
- An asset name (will be used as asset code for the NFT, max 12 character)
- A thumbnail image ( will be used as NFT image and thumbnail on marketplace)
- Minted by (auto filed from logged in stellar wallet address)
*/

export default function NFTCreate({ mode, nft }: NFTCreateProps) {
  const [thumbnailFile, setThumbnailFile] = useState<File>();
  const [mediaFile, setMediaFile] = useState<File>();

  const [nftType, setNftType] = useState<NFTType>(nft?.type ?? NFTType.VIDEO);
  const [privacyState, setPrivacy] = useState(
    nft?.privacy ?? NFTPrivacy.FOR_SALE,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailLink, setThumbnailLink] = useState(nft?.thumbnailUrl);
  const [mediaLink, setMediaLink] = useState(nft?.mediaUrl);

  const [trxdata, setTrxdata] = useState<trxResponse>();
  const [loading, setLoading] = useState<boolean>(false);
  const [ipfsHash, setIpfsHash] = useState<PinataResponse>();

  const [code, setCode] = useState(nft?.nftAsset?.code);
  const [codeError, setCodeError] = useState<string>();
  const [price, setPrice] = useState(nft?.price ?? "100");

  const [nftName, setName] = useState(nft?.name);
  const [nameError, setNameError] = useState(() => {
    if (!nftName) {
      return "Name is required";
    }
  });

  function resetState() {
    if (mode == ModalMode.ADD) {
      setThumbnailFile(undefined);
      setMediaFile(undefined);
      setIsUploading(false);
      setThumbnailLink(undefined);
      setMediaLink(undefined);
      setTrxdata(undefined);
      setCode(undefined);
      setCodeError(undefined);
      setName(undefined);
      setPrice("100");
      setNameError(undefined);
      reset();
      mutation.reset();
    }
  }

  const { pubkey, walletType } = useConnectWalletStateStore();

  const utils = api.useContext();

  const { data: firebaseConfig } = api.firebase.getApp.useQuery(undefined);
  const mutation = api.nft.create.useMutation({
    async onSuccess() {
      await utils.market.getMarketNft.invalidate();
    },
    onError(error, variables, context) {
      toast.error(error.message);
    },
  });

  const { data: secrets } = api.steller.getSecrets.useQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    trigger,
    watch,
    reset,
    setError,
    clearErrors,
    getValues,
  } = useForm<Inputs>({
    defaultValues: {
      description: nft?.description,
    },
  });

  useEffect(() => {
    if (nftName) {
      if (nftName.length < 4) {
        setNameError("Name length has to be more than 3");
      } else if (nftName.length > 45) {
        setNameError("Name length has less be more than 45");
      } else {
        setNameError(undefined);
      }
    }
  }, [nftName]);

  const onChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const thumnailChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailLink(URL.createObjectURL(file));
    }
  };

  // Function to upload the selected file to Pinata
  const mediaFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (file) {
      setMediaFile(file);
      setMediaLink(URL.createObjectURL(file));
    }
  };

  const onUpdate: SubmitHandler<Inputs> = async ({ description, limit }) => {
    if (nft) {
      // requird filed name
      if (nftName && isEmpty(nftName)) {
        toast.error("Name can't be empty");
        if (nftName.length < 3)
          setNameError("Name length have to be more than 3");
        return;
      }
      // check the two object have to changed a bit
      if (!thumbnailFile && !mediaFile) {
        // toast("file have not changed");
      }

      // atleast one field have changed
      // writeen Cases,
      // determine which field get changed, just update this value in the mutation data.
      let imgUrl = nft.thumbnailUrl;
      let musicUrl = nft.mediaUrl;

      // 1. if file chane
      if (thumbnailFile && firebaseConfig && nft.id) {
        // thumbnail changed. have to upload new file and get  url
        const thumbnailFileExtention =
          thumbnailFile.name.split(".").pop() ?? "jpg";

        imgUrl = await uploadFileToFirstore(
          firebaseConfig,
          thumbnailFile,
          getNftThumbnailLocation(nft.id, thumbnailFileExtention),
        );
      }
      if (mediaFile && firebaseConfig && nft.id) {
        // file 2 changed. have to upload new file and get  url
        const mediaFileExtention = mediaFile.name.split(".").pop() ?? "mp3";
        musicUrl = await uploadFileToFirstore(
          firebaseConfig,
          mediaFile,
          getNftMediaLocation(nft.id, mediaFileExtention),
        );
      }

      // 2. if string data change
      // Privacy

      const selctedPrivacyOption = privacyState;

      const nftAsset = nft.nftAsset;
      const validatedPrice = validatePrice(price);

      // toast(privacyState ? privacyState : "x", selectedPrivacyOption);
      // set default value of the other field

      mutation.mutate({
        copies: nft.copies,
        price: validatedPrice,
        type: nft.type,
        thumbnailUrl: imgUrl,
        id: nft.id,
        mediaUrl: musicUrl,
        name: nftName!, // songname is no empty here
        edit: true,
        path: nft.path,
        asset: nftAsset,
        description,
        privacy: selctedPrivacyOption,
      });
    } else {
      toast.error("NFT Invalid");
    }
  };

  function getFileExtention(file: File) {
    return file.name.split(".").pop() ?? "jpg";
  }

  const onAdd: SubmitHandler<Inputs> = async ({ description, limit }) => {
    if (nftName && nftName.length > 2) {
      // watch for trxdata
      if (!trxdata) {
        return toast.error("Create token");
      }

      const id = uid(); //generateHashIdFromName(`${nftName}and${albumIdIdx}`);
      if (firebaseConfig) {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        // Initialize Cloud Firestore and get a reference to the service
        const storage = getStorage(app);

        let url2: string;
        let url1 = DEFAULT_COVER;

        if (thumbnailFile && mediaFile) {
          setIsUploading(true);
          // upload the cover to the pinata

          const mediaFileExtention = getFileExtention(mediaFile);
          // media file
          const storageRef2 = ref(
            storage,
            getNftMediaLocation(id, mediaFileExtention),
          );
          await uploadBytes(storageRef2, mediaFile);
          url2 = await getDownloadURL(storageRef2);

          // cover file
          const thumbnailFileExtention = getFileExtention(thumbnailFile);
          const storageRef1 = ref(
            storage,
            getNftThumbnailLocation(id, thumbnailFileExtention),
          );
          await uploadBytes(storageRef1, thumbnailFile);
          url1 = await getDownloadURL(storageRef1);

          // end the uploading
          setIsUploading(false);
        } else {
          toast.error("Problem in cover image or meida file");
          return;
        }

        // set default value of the other field

        // const { selectedPrivacyOption, assetWithIssuer } =
        //   getValidatedPrivacyOption(assetCode, issuer, song);

        const selctedPrivacyOption = privacyState;

        const assetprice = validatePrice(price);
        const llimit = validateLimit(limit); // limit bondery
        const nftAsset: NFTAsset = {
          code: code!, // if trxdata is here thats mean code is not undefined
          distributor: trxdata.distributorSecret,
          issuer: trxdata.issuerAcc,
          ipfs: trxdata.ipfsHash,
          limit: limit,
        };

        mutation.mutate({
          price: assetprice,
          issuerSecretInfo: { code: code!, ...trxdata.issuerAcc },
          copies: llimit,
          type: nftType,
          thumbnailUrl: url1,
          id: id,
          mediaUrl: url2,
          asset: nftAsset,
          name: nftName,
          edit: false,
          privacy: selctedPrivacyOption,
          description: description,
        });
      } else {
        toast.error("firebase config problem");
      }
    } else {
      toast.error("Asset name problem, Id could not generated");
      setName("Name length have to be more than 2");
    }

    log.info(isEmpty(description));
  };

  function onPrivacySelectOptionChanged(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const privacy = event.currentTarget.value as NFTPrivacy;
    setPrivacy(privacy);
  }

  function onNFTSelectOptionChanged(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    const selectedNftType = event.currentTarget.value as NFTType;
    setNftType(selectedNftType);
    // On NFT Type Change prev mediaFileShould not be there
    setMediaFile(undefined);
    setMediaLink(undefined);
  }

  async function handleTokenCreate() {
    // assetCreateMutation.reset();
    if (thumbnailFile && nftName) {
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
          // const ipfsRes = await pinFileToIPFS({ file: thumbnailFile, name: nftName });
          const ipfsRes: false | PinataResponse = {
            IpfsHash: "test",
            PinSize: 2,
            Timestamp: "203",
          };
          // if (ipfsRes === false) {
          //   toast.error("Problem with uploading to pinata");
          //   setLoading(false);
          //   return;
          // } else {
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
          // }
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
          <SuccessAlert message="NFT Asset Created" />
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
          {!nft || (nft && !nft.nftAsset) ? (
            <div
              className="btn btn-primary btn-sm "
              onClick={handleTokenCreate}
            >
              {loading && <span className="loading loading-spinner" />}
              Create Token
            </div>
          ) : null}
        </div>
      );
  }

  return (
    <Modal
      modalFor={ModalType.ITEM}
      mode={mode}
      headerMessage=""
      // handleSaveClick={mode == ModalMode.ADD ? createSong : updateSong}
      handleSaveClick={() => resetState()}
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
                <SuccessAlert message="Data mutation successful" />
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
                        <label className="label font-bold">Item Info</label>
                        <div className="w-full max-w-xs">
                          <label className="label">Name</label>
                          <input
                            minLength={3}
                            required
                            value={nftName}
                            maxLength={45}
                            onChange={(e) => onChangeName(e)}
                            className="input input-bordered input-sm  w-full"
                            placeholder="Enter Item Name"
                          />
                          {nameError && (
                            <label className="label">
                              <span className="label-text-alt text-xs text-red-500">
                                {nameError}
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="w-full max-w-xs">
                          <label className="label">Description</label>
                          <input
                            {...register("description")}
                            className="input input-bordered input-sm  w-full"
                            required
                            placeholder="Description"
                          />
                        </div>
                      </div>
                    </div>

                    {mode == ModalMode.ADD && (
                      <div className="rounded-md bg-base-200 p-2">
                        <label className="label font-bold">Upload File</label>
                        <div className="form-control w-full max-w-xs">
                          <div className="w-full max-w-xs">
                            <label className="label">Item Type</label>
                            <select
                              className="select select-bordered select-sm w-full max-w-xs"
                              onChange={onNFTSelectOptionChanged}
                              value={nftType}
                            >
                              {Object.values(NFTType).map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label className="label">
                            <span className="label-text">
                              Choose a thumbnail (This will be used as NFT
                              Image)
                            </span>
                          </label>

                          {mode == ModalMode.ADD ? (
                            <input
                              required
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={thumnailChanged}
                              className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                            />
                          ) : (
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={thumnailChanged}
                              className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                            />
                          )}
                          {thumbnailLink && (
                            <>
                              <Image
                                className="p-2"
                                width={120}
                                height={120}
                                alt="preview image"
                                src={thumbnailLink}
                              />
                            </>
                          )}
                        </div>

                        {/* Conditional Input field */}
                        <NFTUploadItem
                          itemChanged={mediaFileChange}
                          mode={mode}
                          itemLink={mediaLink}
                          nftType={nftType}
                        />
                      </div>
                    )}

                    <div className="w-full max-w-xs">
                      <label className="label">Choose Item privacy type</label>
                      <select
                        className="select select-bordered select-sm w-full max-w-xs"
                        onChange={onPrivacySelectOptionChanged}
                        value={privacyState}
                      >
                        {Object.values(NFTPrivacy).map((privacy) => (
                          <option key={privacy} value={privacy}>
                            {privacy}
                          </option>
                        ))}
                      </select>
                    </div>

                    <>
                      <div className="rounded-md bg-base-200 p-2">
                        <label className="label  font-bold">NFT Info</label>
                        {nft?.nftAsset ? (
                          <div>
                            <p>{nft.nftAsset.code}</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-full max-w-xs ">
                              <label className="label">
                                <span className="label-text">
                                  Asset Name <Required />
                                </span>
                                <span className="label-text-alt">
                                  You can not change it later
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
                                maxLength={12}
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
                                <span className="label-text">Amount</span>
                                <span className="label-text-alt">
                                  Default is 1
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
                            <span className="label-text">
                              Price <Required />
                            </span>
                            <span className="label-text-alt">
                              Price will be set in in {env.NEXT_PUBLIC_SITE}
                            </span>
                          </label>
                          <input
                            step="0.1"
                            type="number"
                            required
                            value={Number(price)}
                            min={1}
                            onChange={(e) => setPrice(e.target.value)}
                            className="input input-bordered input-sm  w-full"
                            placeholder="Price"
                          />
                          <label className="label">
                            <span className="label-text">
                              Final Price: {Number(price) + 50}{" "}
                            </span>
                            <span className="label-text-alt">
                              Fee: 50 {env.NEXT_PUBLIC_SITE}
                            </span>
                          </label>
                        </div>

                        {/* <WarningAlert message="Some alert lorem20 fdjaf dlkdjfsldkf ksdfjas;dfk sj;ldkf lsjkfdal;sd f kjfs;dlf  akj" /> */}
                        {conditonalError()}
                        {conditionalAssetCreateButton()}
                      </div>
                    </>
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

function Required() {
  return <span className="text-xs text-red-500">{`(Required)`}</span>;
}

function NFTUploadItem({
  mode,
  itemChanged,
  itemLink,
  nftType,
}: {
  mode: ModalMode;
  itemChanged: (e: ChangeEvent<HTMLInputElement>) => void;
  itemLink?: string;
  nftType?: NFTType;
}) {
  if (!nftType || nftType == NFTType.MUSIC) {
    return (
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">Choose your music (required)</span>
        </label>

        {mode == ModalMode.ADD ? (
          <input
            onChange={itemChanged}
            accept="audio/mpeg"
            type="file"
            className="file-input file-input-bordered  file-input-sm w-full max-w-xs"
            required
          />
        ) : (
          <input
            onChange={itemChanged}
            accept="audio/mpeg"
            type="file"
            className="file-input file-input-bordered  file-input-sm w-full max-w-xs"
          />
        )}

        {itemLink && (
          <>
            <audio controls className="py-2">
              <source src={itemLink} type="audio/mpeg" />
            </audio>
            {/* <AudioPlayer src={audioLink} /> */}
          </>
        )}
      </div>
    );
  } else if (nftType == NFTType.IMAGE || nftType == NFTType.GIF) {
    return (
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">
            Choose your {nftType == NFTType.IMAGE ? "Image" : "GIF"} (required)
          </span>
        </label>

        <input
          onChange={itemChanged}
          accept={
            nftType == NFTType.IMAGE
              ? "image/png, image/jpeg, image/webp"
              : "image/gif, image/webp"
          }
          type="file"
          className="file-input file-input-bordered  file-input-sm w-full max-w-xs"
          required={mode == ModalMode.ADD}
        />

        {itemLink && (
          <Image
            className="p-2"
            width={120}
            height={120}
            alt="preview image"
            src={itemLink}
          />
        )}
      </div>
    );
  } else if (nftType == NFTType.VIDEO) {
    return (
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">Choose your video file (required)</span>
        </label>

        <input
          onChange={itemChanged}
          accept="video/mp4, video/ogg"
          type="file"
          className="file-input file-input-bordered  file-input-sm w-full max-w-xs"
          required={mode == ModalMode.ADD}
        />

        {itemLink && (
          <video width="320" height="240" controls>
            <source src={itemLink} type="video/mp4" />
          </video>
        )}
      </div>
    );
  }
}

export function validateLimit(l: string) {
  let llimit = 1; // limit bondery default
  if (!isEmpty(l)) {
    const numberValue = Number(l);
    if (!isNaN(numberValue) && numberValue > 0) {
      llimit = Math.floor(numberValue);
    }
  }
  return llimit;
}

export function validatePrice(price: string) {
  let validatedPrice = DEFAULT_ASSET_PRICE;
  if (!isEmpty(price)) {
    const numberValaue = Number(price);
    if (!isNaN(numberValaue) && numberValaue > 0) {
      validatedPrice = price;
    }
  }

  // add more 50
  const finalPrice = Number(validatedPrice);

  return finalPrice.toString();
}
