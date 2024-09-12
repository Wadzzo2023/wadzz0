import React from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { Button } from "../shadcn/ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";

export default function UserList() {
  const users = api.admin.user.getUsers.useQuery();

  if (users.isLoading) return <p>Loading ..</p>;
  if (users.isError) return <p>Error</p>;

  return (
    <div>
      <div className="overflow-x-auto bg-base-100">
        <table className="table table-zebra">
          {/* head */}
          <thead>
            <tr>
              <th></th>
              <th>Pubkey</th>
              <th>Joined At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((u, i) => {
              return (
                <tr key={u.id}>
                  <th>{i + 1}</th>
                  <td>{u.id}</td>
                  <td>{u.bio}</td>
                  <td>
                    <DeleteUserButton user={u.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeleteUserButton({ user }: { user: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const deleteUser = api.admin.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      setIsOpen(false);
    },
  });
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            {deleteUser.isLoading && (
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
              Are you sure you want to delete this user? This action is
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
                  deleteUser.mutate(user);
                }}
                disabled={deleteUser.isLoading}
                className="w-full"
              >
                {deleteUser.isLoading && (
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
