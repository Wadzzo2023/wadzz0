import clsx from "clsx";
import { Heart, Lock, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";

import { Media, Post } from "@prisma/client";

import { PostContextMenu } from "../post/post-context-menu";
import { PostReadMore } from "../post/post-read-more";
import Avater from "../../ui/avater";
import { getBageStyle } from "./card";
import { Card, CardHeader, CardContent } from "~/components/shadcn/ui/card";

export function PostCard({
  post,
  show = false,
  like,
  comments,
  creator,
  priority,
  media,
}: {
  creator: { name: string; id: string; profileUrl: string | null };
  post: Post;
  show?: boolean;
  like: number;
  comments: number;
  priority?: number;
  media?: Media;
}) {
  const likeMutation = api.fan.post.likeApost.useMutation();
  const deleteLike = api.fan.post.unLike.useMutation();
  // const { data: likes, isLoading } = api.post.getLikes.useQuery(post.id);
  const { data: liked } = api.fan.post.isLiked.useQuery(post.id);

  const creatorProfileUrl = `/fans/creator/${post.creatorId}`;
  const postUrl = `/fans/posts/${post.id}`;

  return (
    <div
      key={post.id}
      className="card card-compact w-full bg-base-100  shadow-xl  md:w-[60%]"
    >
      {media && (
        <figure className="relative h-60  w-full">
          <Image
            className={clsx(!show && "blur-sm")}
            src={media.url}
            layout="fill"
            objectFit="cover"
            alt="Post Image"
          />
        </figure>
      )}
      <div className="card-body">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <div>
              <Avater url={creator.profileUrl} className="w-8" />
            </div>
            <div>
              <Link href={creatorProfileUrl} className="font-bold">
                {creator.name}
              </Link>
              <p>
                {priority && (
                  <span className={clsx("badge  mr-1", getBageStyle(priority))}>
                    {priority}
                  </span>
                )}
                {formatPostCreatedAt(post.createdAt)}
              </p>
            </div>
          </div>
          <PostContextMenu creatorId={post.creatorId} postId={post.id} />
        </div>

        {!show ? (
          <h2 className="card-title">{post.heading}</h2>
        ) : (
          <Link href={postUrl}>
            <h2 className="card-title">{post.heading}</h2>
          </Link>
        )}

        {!show ? (
          <Link href={creatorProfileUrl} className="btn ">
            <Lock />
            Unlock Post
          </Link>
        ) : (
          <>
            <PostReadMore post={post} />

            <div className="mt-4 flex items-center justify-start gap-2 border-t border-gray-600  px-10">
              <div className="flex items-center justify-center gap-1">
                {deleteLike.isLoading || likeMutation.isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <div className="btn btn-circle btn-ghost btn-sm">
                    <Heart
                      onClick={() =>
                        liked
                          ? deleteLike.mutate(post.id)
                          : likeMutation.mutate(post.id)
                      }
                      className={clsx(liked && "fill-primary text-primary ")}
                    />
                  </div>
                )}
                <p className="font-bold">{like}</p>
              </div>

              <Link className="" href={postUrl}>
                <div className="flex items-center justify-center gap-1">
                  <div className="btn btn-circle btn-ghost btn-sm">
                    <MessageCircle />
                  </div>{" "}
                  <p className="font-bold">{comments}</p>
                </div>
              </Link>
              {/* <Share2 size={20} /> */}
            </div>
          </>
        )}
      </div>
    </div>

    // <div className="w-2xl container mx-12 my-2 grid grid-cols-1 gap-6 px-1 md:my-12 md:px-20">
    //   <div className="">
    //     <div className=" rounded-lg bg-white shadow">
    //       <div className="mx-3 flex flex-row px-2 py-3">
    //         <div className="h-auto w-auto rounded-full">
    //           <Image
    //             height={16}
    //             width={16}
    //             className=" h-12 w-12 cursor-pointer rounded-full object-cover shadow"
    //             alt="User avatar"
    //             src={"/images/icons/avatar-icon.png"}
    //           />
    //         </div>
    //         <div className="mb-2 ml-4 mt-1 flex flex-col">
    //           <div className="text-sm font-semibold text-gray-600">
    //             John Doe
    //           </div>
    //           <div className="mt-1 flex w-full">
    //             <div className="font-base mr-1 cursor-pointer text-xs text-blue-700">
    //               SEO
    //             </div>
    //             <div className="text-xs font-thin text-gray-400">
    //               • 30 seconds ago
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //       <div className="border-b border-gray-100"></div>
    //       <div className="mx-3 mb-7 mt-6 px-2 text-sm font-medium text-gray-400">
    //         <div className="col-span-2 grid grid-cols-6   gap-2  ">
    //           {media?.map((el, id) => (
    //             <div
    //               key={id}
    //               className="col-span-3 max-h-[20rem] overflow-hidden rounded-xl"
    //             >
    //               <Image
    //                 height={100}
    //                 width={100}
    //                 className="aspect-square h-full w-full object-cover "
    //                 src={el.url}
    //                 alt=""
    //               />
    //             </div>
    //           ))}

    //           {/* <div className="relative col-span-2 max-h-[10rem] overflow-hidden rounded-xl">
    //             <div className="absolute inset-0 flex items-center  justify-center bg-slate-900/80 text-xl text-white">
    //               + 23
    //             </div>
    //             <Image
    //               height={16}
    //               width={16}
    //               className="h-full w-full object-cover "
    //               src={"/public/images/icons/avatar-icon.png"}
    //               alt=""
    //             />
    //           </div> */}
    //         </div>
    //       </div>
    //       <div className="mx-3 mb-6 px-2 text-sm text-gray-500">
    //         Lorem Ipsum is simply dummy text of the printing and typesetting
    //         industry. Lorem Ipsum has been the industry's standard dummy text
    //         ever since the 1500
    //       </div>
    //       <div className="mb-4 flex justify-start border-t border-gray-100">
    //         <div className="mt-1 flex w-full pl-5 pt-2">
    //           <span className="mr-2 h-8 w-8 cursor-pointer rounded-full border bg-white px-2 pt-2 text-center text-gray-400 transition duration-300 ease-out hover:text-red-500">
    //             <svg
    //               xmlns="http://www.w3.org/2000/svg"
    //               fill="none"
    //               width="14px"
    //               viewBox="0 0 24 24"
    //               stroke="currentColor"
    //             >
    //               <path
    //                 stroke-linecap="round"
    //                 stroke-linejoin="round"
    //                 stroke-width="2"
    //                 d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    //               ></path>
    //             </svg>
    //           </span>
    //           <Image
    //             height={16}
    //             width={16}
    //             className="inline-block h-8 w-8 cursor-pointer rounded-full border-2 border-white object-cover text-white shadow-sm"
    //             src={"/public/images/icons/avatar-icon.png"}
    //             alt=""
    //           />
    //           <Image
    //             height={16}
    //             width={16}
    //             className="-ml-2 inline-block h-8 w-8 cursor-pointer rounded-full border-2 border-white object-cover text-white shadow-sm"
    //             src={"/public/images/icons/avatar-icon.png"}
    //             alt=""
    //           />
    //           <Image
    //             height={16}
    //             width={16}
    //             className="-ml-2 inline-block h-8 w-8 cursor-pointer rounded-full border-2 border-white object-cover text-white shadow-sm"
    //             src={"/public/images/icons/avatar-icon.png"}
    //             alt=""
    //           />
    //           <Image
    //             height={16}
    //             width={16}
    //             className="-ml-2 inline-block h-8 w-8 cursor-pointer rounded-full border-2 border-white object-cover text-white shadow-sm"
    //             src={"/public/images/icons/avatar-icon.png"}
    //             alt=""
    //           />
    //         </div>
    //         <div className="mt-1 flex w-full justify-end pr-5 pt-2">
    //           <span className="mr-2 h-8 w-8 cursor-pointer rounded-full bg-blue-100 px-2 py-2 text-center text-blue-400 transition duration-300 ease-out hover:bg-blue-50">
    //             <svg
    //               xmlns="http://www.w3.org/2000/svg"
    //               fill="none"
    //               width="14px"
    //               viewBox="0 0 24 24"
    //               stroke="currentColor"
    //             >
    //               <path
    //                 stroke-linecap="round"
    //                 stroke-linejoin="round"
    //                 stroke-width="2"
    //                 d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    //               ></path>
    //             </svg>
    //           </span>
    //           <span className="h-8 cursor-pointer rounded-full bg-gray-100 px-2 py-2 text-center text-gray-100 transition duration-300 ease-out hover:bg-gray-50">
    //             <svg
    //               className="h-4 w-4 text-red-500"
    //               fill="none"
    //               viewBox="0 0 24 24"
    //               stroke="currentColor"
    //               stroke-width="2"
    //             >
    //               <path
    //                 stroke-linecap="round"
    //                 stroke-linejoin="round"
    //                 d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
    //               ></path>
    //             </svg>
    //           </span>
    //         </div>
    //       </div>
    //       <div className="flex w-full border-t border-gray-100">
    //         <div className="mx-5 mt-3 flex flex-row text-xs">
    //           <div className="mb-2 mr-4 flex items-center rounded-md font-normal text-gray-700">
    //             Comments:<div className="text-ms ml-1 text-gray-400"> 30</div>
    //           </div>
    //           <div className="mb-2 mr-4 flex items-center rounded-md font-normal text-gray-700">
    //             Views: <div className="text-ms ml-1 text-gray-400"> 60k</div>
    //           </div>
    //         </div>
    //         <div className="mx-5 mt-3 flex w-full justify-end text-xs">
    //           <div className="mb-2 mr-4  flex items-center rounded-md text-gray-700">
    //             Likes: <div className="text-ms ml-1  text-gray-400"> 120k</div>
    //           </div>
    //         </div>
    //       </div>
    //       <div className="flex p-4 text-black antialiased">
    //         <Image
    //           height={16}
    //           width={16}
    //           className="mr-2 mt-1 h-8 w-8 rounded-full "
    //           src=""
    //           alt=""
    //         />
    //         <div>
    //           <div className="rounded-lg bg-gray-100 px-4 pb-2.5 pt-2">
    //             <div className="text-sm font-semibold leading-relaxed">
    //               Sara Lauren
    //             </div>
    //             <div className="text-xs leading-snug md:leading-normal">
    //               Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
    //               do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    //               Ut enim ad minim veniam, quis nostrud exercitation ullamco
    //               laboris nisi ut aliquip ex ea commodo consequat.
    //             </div>
    //           </div>
    //           <div className="mt-0.5  text-xs text-gray-500">14 w</div>
    //           <div className="float-right -mt-8 mr-0.5 flex items-center rounded-full border border-white bg-white shadow ">
    //             {/* icon */}
    //             {/* icon */}
    //             <span className="ml-1 pr-1.5 text-sm text-gray-500">3</span>
    //           </div>
    //         </div>
    //       </div>
    //       <div className="relative flex w-full max-w-xl items-center self-center overflow-hidden p-4 text-gray-600 focus-within:text-gray-400">
    //         <Image
    //           height={16}
    //           width={16}
    //           className="mr-2 h-10 w-10 cursor-pointer rounded-full object-cover shadow"
    //           alt="User avatar"
    //           src=""
    //         />
    //         <span className="absolute inset-y-0 right-0 flex items-center pr-6">
    //           <button
    //             type="submit"
    //             className="p-1 hover:text-blue-500 focus:shadow-none focus:outline-none"
    //           >
    //             <svg
    //               className="h-6 w-6 text-gray-400 transition duration-300 ease-out hover:text-blue-500"
    //               xmlns="http://www.w3.org/2000/svg"
    //               fill="none"
    //               viewBox="0 0 24 24"
    //               stroke="currentColor"
    //             >
    //               <path
    //                 stroke-linecap="round"
    //                 stroke-linejoin="round"
    //                 stroke-width="2"
    //                 d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    //               ></path>
    //             </svg>
    //           </button>
    //         </span>
    //         <input
    //           type="search"
    //           className="rounded-tg w-full appearance-none border border-transparent bg-gray-100 py-2 pl-4 pr-10 text-sm placeholder-gray-400"
    //           placeholder="Post a comment..."
    //         />
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}
