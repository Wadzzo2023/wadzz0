import { ReactNode, RefObject, useRef, MouseEvent } from "react";
import ModalButton from "../button/add_button";
import { Edit2Icon, PlusIcon } from "lucide-react";

interface ModalProps {
  children: ReactNode;
  actionButton: ReactNode;
  handleSaveClick?: () => void;
  headerMessage: string;
}

export default function ConfirmationModal({
  children,
  handleSaveClick: handleCloseClick,
  headerMessage,
  actionButton,
}: ModalProps) {
  const createAlbumModal = useRef<HTMLDialogElement>(null);

  const handleModal = () => {
    createAlbumModal.current?.showModal();
  };

  return (
    <>
      <dialog className="modal" ref={createAlbumModal}>
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={handleCloseClick}
            >
              ✕
            </button>
          </form>
          <h3 className="text-lg font-bold">{headerMessage}</h3>
          <div className="py-5">{children}</div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={handleCloseClick}>
                Close
              </button>
            </form>
          </div>
        </div>

        {/* <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form> */}
      </dialog>
      <div onClick={handleModal}>{actionButton}</div>
    </>
  );
}
