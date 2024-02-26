import { ReactNode } from "react";
export default function ModalButton({
  content,
  handleClick,
  children,
}: {
  content?: string;
  handleClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className="btn btn-neutral btn-sm w-40 rounded-3xl"
      onClick={handleClick}
    >
      {children}
      {content}
    </button>
  );
}
