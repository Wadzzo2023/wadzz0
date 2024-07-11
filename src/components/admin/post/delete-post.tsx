import React from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";

export default function DeletePost() {
  const [id, setId] = React.useState<number>();
  const deletePost = api.admin.user.deleteAPost.useMutation({
    onSuccess: () => toast.success("Post deleted"),
    onError: (e) => toast.error(e.message),
  });
  return (
    <div>
      <input
        onChange={(e) => {
          setId(Number(e.target.value));
        }}
        type="number"
        className="input input-bordered"
        placeholder="Enter Post ID"
      />
      <button
        className="btn"
        onClick={() => {
          if (id) {
            deletePost.mutate(id);
          } else {
            toast.error("Enter a valid post id");
          }
        }}
      >
        {deletePost.isLoading && <span className="loading loading-spinner" />}
        Delete
      </button>
    </div>
  );
}
