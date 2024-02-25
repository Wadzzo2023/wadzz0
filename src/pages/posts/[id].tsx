import { useRouter } from "next/router";
import { AddComment } from "~/components/fan/post/add-comment";
import CommentView from "~/components/fan/post/comment";
import { SinglePostView } from "~/components/fan/post/single-post";
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
