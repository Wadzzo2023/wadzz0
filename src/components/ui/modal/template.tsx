import React, { useRef } from "react";

export default function ModalTemplate() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const handleModal = () => {
    modalRef.current?.showModal();
  };
  return (
    <>
      <button className="btn" onClick={handleModal}>
        open modal
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="text-lg font-bold">Hello!</h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
