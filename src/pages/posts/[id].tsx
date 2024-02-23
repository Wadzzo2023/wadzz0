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
  return (
    <div className="flex h-full  flex-1 flex-col items-center  p-5">
      <h2 className="mb-5 text-center text-2xl font-bold">Post by Creator</h2>
      <div className=" w-full  flex-1  overflow-auto rounded-box ">
        <SinglePostView postId={Number(postId)} />
      </div>
    </div>
  );
}
