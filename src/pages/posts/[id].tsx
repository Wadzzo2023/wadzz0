import { useRouter } from "next/router";
import { AddComment } from "~/components/post/add-comment";
import CommentView from "~/components/post/comment";
import { SinglePostView } from "~/components/post/single-post";
import Slider from "~/components/ui/carosel";
import { api } from "~/utils/api";

export default function PostPage() {
  const router = useRouter();
  const postId = router.query.id;

  if (typeof postId == "string") {
    return <Page postId={postId} />;
  }

  return <div>Error</div>;
}

function Page({ postId }: { postId: string }) {
  return <SinglePostView postId={Number(postId)} />;
}
