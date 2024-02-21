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
  const images = [
    "https://picsum.photos/id/1003/800/600",
    "https://picsum.photos/id/1004/800/600",
    "https://picsum.photos/id/1005/800/600",
    "https://picsum.photos/id/1006/800/600",
    "https://picsum.photos/id/1008/800/600",
    "https://picsum.photos/id/1009/800/600",
    "https://picsum.photos/id/1010/800/600",
    "https://picsum.photos/id/1011/800/600",
    "https://picsum.photos/id/1012/800/600",
    "https://picsum.photos/id/1013/800/600",
  ];

  return (
    <div className="flex h-full  flex-1 flex-col p-5">
      <h2 className="mb-5 text-center text-3xl font-bold">Post by Creator</h2>
      <div className=" w-full  flex-1  rounded-box bg-base-100">
        <SinglePostView postId={Number(postId)} />
      </div>
    </div>
  );
}
