import React from "react";
import { api } from "~/utils/api";
import { Button } from "../shadcn/ui/button";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import { set } from "lodash";

export default function AdminsList() {
  const admins = api.wallate.admin.admins.useQuery();
  if (admins.isLoading) return <div>Loading...</div>;
  if (admins.data)
    return (
      <div className="my-4 overflow-x-auto rounded-lg bg-base-200 p-4">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>PUBKEY</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
            {admins.data.map((admin, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{admin.id}</td>
                <td>{admin.joinedAt.getFullYear()}</td>
                <td>
                  <DeleteAdminButton admin={admin.id} />
                </td>
              </tr>
            ))}
          </thead>
          <tbody></tbody>
        </table>
      </div>
    );
}

function DeleteAdminButton({ admin }: { admin: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const deleteAdmin = api.wallate.admin.deleteAdmin.useMutation({
    onSuccess: () => {
      toast.success("Admin deleted");
      setIsOpen(false);
    },
  });
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            {deleteAdmin.isLoading && (
              <span className="loading loading-spinner"></span>
            )}
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div>
            <p>
              Are you sure you want to delete this admin? This action is
              irreversible.
            </p>
          </div>
          <DialogFooter className=" w-full">
            <div className="flex w-full gap-4  ">
              <DialogClose className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                type="submit"
                onClick={() => {
                  deleteAdmin.mutate(admin);
                }}
                disabled={deleteAdmin.isLoading}
                className="w-full"
              >
                {deleteAdmin.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
