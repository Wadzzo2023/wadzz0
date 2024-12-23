import { useRouter } from "next/router";
import { SinglePostView } from "~/components/fan/post/single-post";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/shadcn/ui/card";
import { Button } from "~/components/shadcn/ui/button";
import { Skeleton } from "~/components/shadcn/ui/skeleton";

export default function PostPage() {
  const router = useRouter();

  const postId = router.query.id;

  if (typeof postId == "string") {
    return <Page postId={postId} />;
  }

  return <div>Error</div>;
}

function Page({ postId }: { postId: string }) {
  const router = useRouter();

  const { data, error, isLoading } = api.fan.post.getAPost.useQuery(Number(postId), {
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (

      <Card className="w-full max-w-2xl mx-auto mt-8 h-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>

    );
  }


  if (error ?? (!data)) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 ">
        <CardHeader>

        </CardHeader>
        <CardContent className="flex flex-col space-y-4 items-center">
          <div className=" w-full flex items-center justify-center bg-background">
            <div className="max-w-md w-full p-6 text-center">
              <h1 className="text-4xl font-bold mb-2">Oops!</h1>
              <div className="text-4xl font-mono mb-8 whitespace-pre">
                {`(╯°□°)╯︵ ┻━┻`}
              </div>
              <h2 className="text-xl mb-2">
                Error 404: Post Not Found.
              </h2>
              <p className="text-muted-foreground mb-8">
                We couldn{"'"}t find a Post with this  URL.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/fans/home')}
                >
                  Go Feed
                </Button>

              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );


  }
  return <SinglePostView post={data} />;
}
