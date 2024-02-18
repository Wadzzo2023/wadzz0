import { useRouter } from 'next/router';
import { AddComment } from '~/components/post/add-comment';
import CommentView from '~/components/post/comment';
import { SinglePostView } from '~/components/post/single-post';
import { api } from '~/utils/api';

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
  const { data: comments, isLoading: commentLoading } =
    api.post.getComments.useQuery(Number(postId));

  if (post.isLoading || commentLoading) return <div>Loading...</div>;

  if (post.isError) return <div>Post not found</div>;
  if (post.data) {
    return (
      <div className="p-5">
        <h2 className="mb-5 text-center text-3xl font-bold">
          Post by {post.data.creator.name}
        </h2>
        <div className="flex w-full flex-col items-center pb-20">
          <>
            <SinglePostView
              priority={post.data.subscription?.priority}
              comments={post.data._count.Comment}
              creator={post.data.creator}
              like={post.data._count.Like}
              post={post.data}
              show
            />
            <div className="card w-96 bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Comments</h2>
                <div className="flex flex-col gap-4">
                  {comments?.map((comment) => (
                    <CommentView key={comment.id} comment={comment} />
                  ))}
                </div>
                <AddComment postId={postId} />
              </div>
            </div>
          </>
        </div>
      </div>
    );
  } else {
    return <p> You do not have proper permission</p>;
  }
}
