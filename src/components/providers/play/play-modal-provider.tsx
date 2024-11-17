import { useEffect, useState } from "react";
import DeleteCollectionModal from "~/components/modals/play/Delete-Collection-Modal";
import JoinBountyModal from "~/components/modals/play/Join-Bounty-Modal";
import LocationInformationModal from "~/components/modals/play/Location-Info-Modal";

const PlayModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <JoinBountyModal />
      <DeleteCollectionModal />
      <LocationInformationModal />
    </>
  );
};

export default PlayModalProvider;
