import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import toast from "react-hot-toast";

export const PostSchema = z.object({
  id: z.string(),
  heading: z.string().min(1, { message: "Required" }),
  content: z.string().min(20, { message: "Minimum 20 is reguired" }),
});

export function CreatPost(props: { id: string }) {
  const utils = api.useUtils();

  const createPostMutation = api.post.create.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Post Created");
    },
  });

  const {
    register,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm<z.infer<typeof PostSchema>>({
    resolver: zodResolver(PostSchema),
    defaultValues: { content: "", id: props.id },
  });

  const onSubmit: SubmitHandler<z.infer<typeof PostSchema>> = (data) => {
    createPostMutation.mutate(data);
  };

  return (
    <div>
      <p>CreatorProfile</p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="my-10 flex flex-col gap-2"
      >
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Heading</span>
          </div>
          <input
            type="text"
            placeholder="Heading of the post"
            {...register("heading")}
            className="input input-bordered w-full max-w-xs"
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
          <div className="label">
            <span className="label-text">Write Details</span>
          </div>
          <textarea
            {...register("content")}
            className="textarea textarea-bordered h-24"
            placeholder="Description ..."
          ></textarea>
          {errors.content && (
            <div className="label">
              <span className="label-text-alt text-warning">
                {errors.content.message}
              </span>
            </div>
          )}
        </label>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={createPostMutation.isLoading}
        >
          {createPostMutation.isLoading && (
            <span className="loading loading-spinner"></span>
          )}
          Create Post{" "}
        </button>
      </form>
    </div>
  );
}
export function PostList(props: { id: string }) {
  const { data, isLoading } = api.post.getPosts.useQuery({
    pubkey: props.id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (data) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((post) => (
          <div
            key={post.id}
            className="card card-compact w-96 bg-base-100 shadow-xl"
          >
            <figure>
              <img
                // src="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
                alt="Post Image"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{post.createdAt.getDate()}</h2>
              <p>{post.content}</p>
              {/* <div className="card-actions justify-end">
                <button className="btn btn-primary">Buy Now</button>
              </div> */}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export function PostMenu(props: { id: string }) {
  return (
    <>
      <CreatPost id={props.id} />
      <PostList id={props.id} />
    </>
  );
}
