"use client";
import { useEffect, useState } from "react";
import SendAssets from "../modals/send-assets-modal";

const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <SendAssets />
    </>
  );
};

export default ModalProvider;
