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
    <button className="btn btn-sm w-40" onClick={handleClick}>
      {children}
      {content}
    </button>
  );
}
