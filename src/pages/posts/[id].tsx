import { useRouter } from "next/router";
import { AddComment } from "~/components/post/add-comment";
import CommentView from "~/components/post/comment";
import { SinglePostView } from "~/components/post/single-post";
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
  const post = api.post.getAPost.useQuery(Number(postId));

  if (post.isLoading) return <div>Loading...</div>;

  if (post.isError) return <div>Post not found</div>;
  if (post.data) {
    return (
      <div className="flex h-full  flex-1 flex-col p-5">
        <h2 className="mb-5 text-center text-3xl font-bold">
          Post by {post.data.creator.name}
        </h2>
        <div className="flex w-full flex-1 flex-col items-center  ">
          <SinglePostView
            priority={post.data.subscription?.priority}
            creator={post.data.creator}
            like={post.data._count.Like}
            post={post.data}
            show
          />
        </div>
      </div>
    );
  } else {
    return <p> You do not have proper permission</p>;
  }
}
