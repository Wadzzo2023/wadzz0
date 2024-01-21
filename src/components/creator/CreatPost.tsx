import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";

export const PostSchema = z.object({
  heading: z.string(),
  content: z.string().min(20, { message: "Minimum 20 is reguired" }),
});

export function CreatPost(props: { id: string }) {
  const utils = api.useUtils();

  const createPostMutation = api.post.create.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof PostSchema>>({
    resolver: zodResolver(PostSchema),
    defaultValues: { content: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof PostSchema>> = (data) =>
    createPostMutation.mutate({ ...data, pubkey: props.id });

  return (
    <div>
      <p>CreatorProfile</p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="my-10 flex flex-col gap-2"
      >
        <label className="form-control">
          <div className="label">
            <span className="label-text">Write Details</span>
          </div>
          <textarea
            {...register("content")}
            className="textarea textarea-bordered h-24"
            placeholder="Description ..."
          ></textarea>
        </label>
        <button className="btn btn-primary" type="submit">
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
                alt="Shoes"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{post.creatorId}</h2>
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
