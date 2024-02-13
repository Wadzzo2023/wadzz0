import clsx from "clsx";
import { MoreHorizontal, Trash2 } from "lucide-react";

export default function ContextMenu({
  handleDelete,
  isLoading,
  bg = "bg-base-100",
}: {
  handleDelete: () => void;
  isLoading: boolean;
  bg?: string;
}) {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-circle btn-ghost btn-sm m-1"
      >
        <MoreHorizontal />
      </div>
      <ul
        tabIndex={0}
        className={clsx(
          "menu dropdown-content z-[1] w-52 rounded-box  p-2 shadow",
          bg,
        )}
      >
        <li>
          <a onClick={handleDelete}>
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <Trash2 size={18} />
            )}
            Delete
          </a>
        </li>
      </ul>
    </div>
  );
}
