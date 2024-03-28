import Link from "next/link";
import React from "react";
import Button from "../ui/button";
import { AdminNavigation, useAdminMenu } from "~/lib/state/admin-tab-menu";
import clsx from "clsx";
import toast from "react-hot-toast";

function AdminRightSide() {
  const color = "gray";
  return (
    <div className="h-full max-h-[800px] w-full">
      {/* <div className="scrollbar-style relative h-full w-full overflow-y-auto rounded-xl bg-base-100/90">
        <div
          className="absolute h-full w-full opacity-10"
          style={{
            backgroundColor: color,
          }}
        />
      </div> */}
      <main className="flex h-full flex-col justify-between space-y-2 p-2">
        <div>
          <AdminButtons />
        </div>
      </main>
    </div>
  );
}

export function AdminButtons() {
  const { setSelectedMenu, selectedMenu } = useAdminMenu();
  return (
    <div className="flex h-full w-full flex-col items-start gap-2 ">
      {Object.keys(AdminNavigation).map((key) => {
        const enumValue = AdminNavigation[key as keyof typeof AdminNavigation];
        return (
          <button
            className={clsx(
              "btn w-full",
              enumValue === selectedMenu && "btn-primary",
            )}
            onClick={() => {
              setSelectedMenu(enumValue as AdminNavigation);
              // toast.success("Selected " + key);
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

export default AdminRightSide;
