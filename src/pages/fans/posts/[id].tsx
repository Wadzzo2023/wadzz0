import { useRouter } from "next/router";
import { SinglePostView } from "~/components/fan/post/single-post";

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
