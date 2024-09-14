import React from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { api } from "~/utils/api";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";

export default function DeletePost() {
  const [id, setId] = React.useState<number>();
  const [isOpen, setIsOpen] = React.useState(false);
  const deletePost = api.admin.user.deleteAPost.useMutation({
    onSuccess: () => toast.success("Post deleted"),
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="flex gap-2 py-2">
      <Input
        onChange={(e) => {
          setId(Number(e.target.value));
        }}
        type="number"
        placeholder="Enter Post ID"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button disabled={deletePost.isLoading}>
            Delete
            {deletePost.isLoading && (
              <span className="loading loading-spinner ml-1 h-4 w-4" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation </DialogTitle>
          </DialogHeader>
          <div>
            <p>
              Are you sure you want to delete this post? This action is
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
                  if (id) {
                    deletePost.mutate(id);
                  } else {
                    toast.error("Enter a valid post id");
                  }
                }}
                disabled={deletePost.isLoading}
                className="w-full"
              >
                {deletePost.isLoading && (
                  <span className="loading loading-spinner" />
                )}
                Confirm
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
