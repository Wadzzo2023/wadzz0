import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import ContextMenu from "../../ui/context-menu";

export function PostContextMenu({
  creatorId,
  postId,
}: {
  creatorId: string;
  postId: number;
}) {
  const { data } = useSession();
  const deletePost = api.post.deletePost.useMutation();

  const handleDelete = () => deletePost.mutate(postId);

  if (data?.user && data.user.id === creatorId) {
    return (
      <ContextMenu
        handleDelete={handleDelete}
        isLoading={deletePost.isLoading}
      />
    );
  }
}
