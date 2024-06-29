"use client";
import { useEffect, useState } from "react";
import SendAssets from "../modals/send-assets-modal";
import ReceiveAssetsModal from "../modals/receive-assets-modal";
import AddAssets from "../modals/add-asset-modal";
import MapModal from "../modals/map-modal";
import CopyCutPinModal from "../modals/copy-cut-pin-modal";

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
      <MapModal />
      <CopyCutPinModal />
    </>
  );
};

export default ModalProvider;
