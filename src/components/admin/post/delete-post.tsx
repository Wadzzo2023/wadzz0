import React from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { api } from "~/utils/api";

export default function DeletePost() {
  const [id, setId] = React.useState<number>();
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
      <Button
        disabled={deletePost.isLoading}
        onClick={() => {
          if (id) {
            deletePost.mutate(id);
          } else {
            toast.error("Enter a valid post id");
          }
        }}
      >
        Delete
        {deletePost.isLoading && (
          <span className="loading loading-spinner ml-1 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
