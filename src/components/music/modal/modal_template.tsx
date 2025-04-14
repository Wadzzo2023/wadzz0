import { ReactNode, RefObject, useRef, MouseEvent } from "react";
import ModalButton from "../button/add_button";
import { Edit2Icon, PlusIcon } from "lucide-react";

interface ModalProps {
  children: ReactNode;
  handleSaveClick?: () => void;
  mode: ModalMode;
  modalFor: ModalType;
  headerMessage: string;
}

export enum ModalMode {
  "EDIT",
  "ADD",
}
export enum ModalType {
  "ALBUM",
  "SONG",
  "BANNER",
}

export default function Modal({
  children,
  mode,
  handleSaveClick: handleCloseClick,
  modalFor,
  headerMessage,
}: ModalProps) {
  const createAlbumModal = useRef<HTMLDialogElement>(null);

  function getButtonText() {
    let buttonText = "";
    if (mode == ModalMode.ADD) {
      buttonText += "ADD";
    } else {
      buttonText += "EDIT";
    }
    if (modalFor == ModalType.ALBUM) {
      buttonText += " ALBUM";
    } else if (modalFor == ModalType.BANNER) {
      buttonText += " BANNER";
    } else {
      buttonText += " SONG";
    }

    return buttonText;
  }
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
          <h3 className="text-lg font-bold">{getButtonText()}</h3>
          <p className="py-4">{headerMessage}</p>
          {children}

          <div className="modal-action">
            {/* <button
              className="btn mt-3"
              onClick={() => {
                void (async () => {
                  await handleSaveClick();
                })();
              }}
            >
              Save
            </button> */}
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
     
      <ModalButton content={getButtonText()} handleClick={handleModal}>
        {mode == ModalMode.ADD ? <PlusIcon /> : <Edit2Icon />}
      </ModalButton>
    </>
  );
}
