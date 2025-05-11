"use client";
import { useEffect, useState } from "react";
import SendAssets from "../modals/send-assets-modal";
import ReceiveAssetsModal from "../modals/receive-assets-modal";
import AddAssets from "../modals/add-asset-modal";
import MapModalComponent from "../modals/map-modal";
import CopyCutPinModal from "../modals/copy-cut-pin-modal";
import ClaimPinModal from "../modals/claim-pin-modal";
import ShareModal from "../modals/share-modal";
import FileUploadModal from "../modals/file-upload-modal";
import EditBountyModal from "../modals/edit-bounty-modal";
import ViewAttachmentModal from "../modals/view-attachment-modal";
import TransactionDetails from "../modals/transaction-history-modal";
import BuyModal from "../modals/buy-modal";
import AssetInfoModal from "../modals/asset-info-modal";
import SongBuyModal from "../modals/song-buy-modal";
import CreatorStoreAssetInfoModal from "../modals/creator-store-asset-info";
import ViewAdminAsset from "../modals/view-admin-asset";
import PinInfoModal from "../modals/pin-info-modal";

const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <SendAssets />
      <ReceiveAssetsModal />
      <AddAssets />
      <MapModalComponent />
      <CopyCutPinModal />
      <ClaimPinModal />
      <ShareModal />
      <FileUploadModal />
      <EditBountyModal />
      <ViewAttachmentModal />
      <TransactionDetails />
      <BuyModal />
      <AssetInfoModal />
      <SongBuyModal />
      <CreatorStoreAssetInfoModal />
      <ViewAdminAsset />
      <PinInfoModal />
    </>
  );
};

export default ModalProvider;
