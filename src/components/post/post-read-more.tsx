import { Post } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";

export function PostReadMore({ post }: { post: Post }) {
  const router = useRouter();
  const isLong = post.content.length > 200;
  if (isLong && router.pathname != `/posts/[id]`) {
    return (
      <div>
        <p>{post.content.slice(0, 200)}</p>
        <Link href={`/posts/${post.id}`} className="text-primary underline">
          Read more
        </Link>
      </div>
    );
  } else {
    return (
      <Link href={`/posts/${post.id}`}>
        <p>{post.content}</p>
      </Link>
    );
  }
}
