import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { MediaType } from "@prisma/client";
import { Image as ImageIcon, Music, Users2, Video, X } from "lucide-react";
import clsx from "clsx";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import { PostCard } from "./post";
import Avater from "../../ui/avater";
import { Editor } from "~/components/editor";

const mediaTypes = [
  { type: MediaType.IMAGE, icon: ImageIcon },
  { type: MediaType.VIDEO, icon: Video },
  { type: MediaType.MUSIC, icon: Music },
];

export const MediaInfo = z.object({
  url: z.string(),
  type: z.nativeEnum(MediaType),
});

type MediaInfoType = z.TypeOf<typeof MediaInfo>;

export const PostSchema = z.object({
  heading: z.string().min(1, { message: "Required" }),
  content: z.string().min(2, { message: "Minimum 2 characters required." }),
  subscription: z.string().optional(),
  medias: z.array(MediaInfo).optional(),
});

export function CreatPost() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,

    formState: { errors },
  } = useForm<z.infer<typeof PostSchema>>({
    resolver: zodResolver(PostSchema),
  });

  console.log(errors, "errors");
  const [media, setMedia] = useState<MediaInfoType[]>([]);
  const [wantMediaType, setWantMedia] = useState<MediaType>();

  const creator = api.fan.creator.meCreator.useQuery();

  const createPostMutation = api.fan.post.create.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Post Created");
      setMedia([]);
    },
  });
  const tiers = api.fan.member.getAllMembership.useQuery();

  const onSubmit: SubmitHandler<z.infer<typeof PostSchema>> = (data) => {
    data.medias = media;
    createPostMutation.mutate(data);
  };

  // Function to add media
  const addMediaItem = (url: string, type: MediaType) => {
    setMedia((prevMedia) => [...prevMedia, { url, type }]);
  };

  const handleWantMediaType = (type: MediaType) => {
    if (!wantMediaType) setWantMedia(type);
  };

  function handleEditorChange(value: string): void {
    setValue("content", value);

    // throw new Error("Function not implemented.");
  }

  if (!creator.data) return <div>You are not creator</div>;

  function TiersOptions() {
    if (tiers.isLoading) return <div className="skeleton h-10 w-20"></div>;
    if (tiers.data) {
      return (
        <Controller
          name="subscription"
          control={control}
          render={({ field }) => (
            <select {...field} className="select select-bordered ">
              <option selected disabled>
                Choose Subscription Model
              </option>
              {tiers.data.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                >{`${model.name} - ${model.price}`}</option>
              ))}
            </select>
          )}
        />
      );
    }
  }
  return (
    <div className="w-full ">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-2 rounded-3xl bg-base-200 p-5"
      >
        <div className="mb-5 flex items-end justify-between ">
          <div className="flex items-center gap-2 ">
            <Avater className="w-8" url={creator.data.profileUrl} />
            <p>{creator.data.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Users2 size={30} />
            <TiersOptions />
          </div>
        </div>
        <label className="form-control w-full ">
          <input
            type="text"
            placeholder="Add a title..."
            {...register("heading")}
            className="input input-bordered w-full "
          />
          {errors.heading && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.heading.message}
              </span>
            </div>
          )}
        </label>

        <label className="form-control">
          {/* <textarea
            {...register("content")}
            className="textarea textarea-bordered h-48"
            placeholder="How's your next thing comming?"
          ></textarea> */}
          <Editor onChange={handleEditorChange} value={getValues("content")} />
          {errors.content && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.content.message}
              </span>
            </div>
          )}
        </label>

        <div>
          <div className="flex h-40 flex-col items-center gap-2">
            <div className="flex gap-2">
              {media.map((el, id) => (
                <Image key={id} src={el.url} alt="d" height={100} width={100} />
              ))}
            </div>
            {wantMediaType && (
              <UploadButton
                endpoint="imageUploader"
                content={{ button: "Add Media", allowedContent: "Max (4MB)" }}
                onClientUploadComplete={(res) => {
                  // Do something with the response
                  // alert("Upload Completed");
                  const data = res[0];

                  if (data?.url) {
                    addMediaItem(data.url, wantMediaType);
                    setWantMedia(undefined);
                    // setMediaUrl(data.url);
                    // console.log(wantMediaType, "mediaType");
                    // setValue("mediaType", wantMediaType);
                    // setValue("mediaUrl", data.url);
                    // updateProfileMutation.mutate(data.url);
                  }
                  // updateProfileMutation.mutate(res);
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  alert(`ERROR! ${error.message}`);
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="my-4 flex justify-between p-2">
              <div className="flex gap-4 ">
                <ImageIcon
                  className={clsx(
                    MediaType.IMAGE == wantMediaType && "text-primary",
                    wantMediaType != undefined &&
                      MediaType.IMAGE != wantMediaType &&
                      "text-neutral",
                  )}
                  onClick={() => {
                    handleWantMediaType(MediaType.IMAGE);
                  }}
                />
                {/* {mediaTypes.map(({ type, icon: IconComponent }) => (
                    <IconComponent
                      key={type}
                      className={clsx(
                        type == wantMediaType && "text-primary",
                        wantMediaType != undefined &&
                          type != wantMediaType &&
                          "text-neutral",
                      )}
                      onClick={() => {
                        handleWantMediaType(type);
                      }}
                    />
                  ))} */}
              </div>

              {wantMediaType && <X onClick={() => setWantMedia(undefined)} />}
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={createPostMutation.isLoading}
        >
          {createPostMutation.isLoading && (
            <span className="loading loading-spinner"></span>
          )}
          Save
        </button>
      </form>
    </div>
  );
}
export function PostList(props: { id: string }) {
  const posts = api.fan.post.getPosts.useInfiniteQuery(
    {
      pubkey: props.id,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (posts.isLoading) return <div>Loading...</div>;
  if (posts.data) {
    return (
      <div className=" flex flex-col gap-2">
        {posts.data?.pages.map((page) =>
          page.posts.map((post) => (
            <PostCard
              comments={post._count.comments}
              creator={post.creator}
              key={post.id}
              post={post}
              like={post._count.likes}
              show
            />
          )),
        )}

        {posts.hasNextPage && (
          <button
            className="btn btn-outline btn-primary"
            onClick={() => void posts.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    );
  }
}

export function PostMenu(props: { id: string }) {
  return (
    <div className="my-7">
      {/* <CreatPost /> */}
      <PostList id={props.id} />
    </div>
  );
}
