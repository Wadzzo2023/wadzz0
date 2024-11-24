import Head from "next/head";
import { PostCard } from "~/components/fan/creator/post";

import { useSession } from "next-auth/react";
import Loading from "~/components/wallete/loading";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import { api } from "~/utils/api";
import { env } from "~/env";

export default function Home() {
  return (
    <>
      <Head>
        <title>Creators | {env.NEXT_PUBLIC_SITE}</title>
        <meta
          name="description"
          content="A subscription-based platform that connects creators with their fans on Stellar Blockchain."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="">
        <AuthShowcase />
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data, status } = useSession();
  // if (status == "authenticated") return <div>{data.user.id}</div>;
  return (
    <div className="w-full">
      <h1 className="bg-base-150 flex items-center justify-center  rounded-md py-3 text-center text-2xl font-bold shadow-md">
        News Feed
      </h1>
      {/* <div className="flex flex-col items-center">
        <CreatorSecret />
      </div> */}
      <div className="mt-10 flex w-full flex-col items-center">
        <AllRecentPost />
      </div>
    </div>
  );
}

function AllRecentPost() {
  const posts = api.fan.post.getAllRecentPosts.useInfiniteQuery(
    {
      limit: 5,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },

      refetchOnWindowFocus: false,
    },
  );

  const handleFetchNextPage = () => {
    void posts.fetchNextPage();
  };

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();

  // if (isLoading2) return <div>Loading to fetch membership...</div>;

  if (posts.isLoading) return <Loading />;
  // return (
  //   <div className="flex flex-col gap-4">
  //     <PostSkeleton />
  //     <PostSkeleton />
  //   </div>
  // );

  if (posts.data) {
    return (
      <div className="flex w-full flex-col items-center">
        {posts.data.pages.map((page) => (
          <>
            {page.posts.length === 0 && <p>There are no post yet</p>}
            {page.posts.map((post) => (
              <PostCard
                priority={1}
                commentCount={post._count.comments}
                creator={post.creator}
                key={post.id}
                post={post}
                likeCount={post._count.likes}
                show={(() => {
                  if (post.subscription) {
                    const bal = getAssetBalanceFromBalance({
                      balances: accBalances.data,
                      code: post.creator.pageAsset?.code,
                      issuer: post.creator.pageAsset?.issuer,
                    });
                    if (post.subscription.price <= bal) {
                      return true;
                    }

                    return false;
                  } else return true;
                })()}
                media={post.medias ? post.medias : []}
              />
            ))}
          </>
        ))}

        {posts.hasNextPage && (
          <button onClick={handleFetchNextPage} className="btn">
            {posts.isFetching && (
              <span className="loading loading-spinner"></span>
            )}
            See more
          </button>
        )}
      </div>
    );
  }
}

export function PostSkeleton() {
  return (
    <div className="flex w-64 flex-col gap-4">
      <div className="skeleton h-32 w-full"></div>
      <div className="skeleton h-4 w-28"></div>
      <div className="skeleton h-4 w-full"></div>
      <div className="skeleton h-4 w-full"></div>
    </div>
  );
}

// function CreatorSecret() {

//   console.log(email, uid);

//   const secret = api.fan.creator.getCreatorSecret.useQuery({ email, uid });
//   if (secret.isLoading) return <div>Loading...</div>;
//   if (secret.data) return <div>{secret.data}</div>;
//   if (secret.error) return <div>{secret.error.message}</div>;
// }
