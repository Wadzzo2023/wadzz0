import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import { schema } from "../../pages/me/creator";

export function CreatPost(props: { id: string }) {
  const utils = api.useUtils();

  const createPostMutation = api.post.create.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = (data) =>
    createPostMutation.mutate({ ...data, pubkey: props.id });

  return (
    <div>
      <p>CreatorProfile</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="text" {...register("content")} />
        <button type="submit">
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
      <div>
        {data.map((post) => (
          <div key={post.id}>
            <p>{post.content}</p>
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
