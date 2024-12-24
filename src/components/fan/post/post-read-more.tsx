import { Post } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { Preview } from "~/components/preview";

export function PostReadMore({ post }: { post: Post }) {
  const router = useRouter();
  const isLong = post.content.length > 200;
  if (isLong && router.pathname != `/fans/posts/[id]`) {
    return (
      <div className="px-2">
        <Preview value={post.content.slice(0, 200)} />

        <Link
          href={`/fans/posts/${post.id}`}
          className="text-primary underline"
        >
          Read more
        </Link>
      </div>
    );
  } else {
    return (
      <div className="px-2">
        <Preview value={post.content} />
      </div>
    );
  }
}
