import React from "react";
import Avater from "~/components/ui/avater";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

export const schema = z.object({
  content: z.string().min(1, { message: "Required" }),
});

export default function CreatorProfile() {
  const { data: session } = useSession();

  if (!session) return <div>LogIn First</div>;

  return <CreatorExist id={session.user.id} />;
}

function CreatPost(props: { id: string }) {
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

function PostList(props: { id: string }) {
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

function CreatorExist(props: { id: string }) {
  const { data, isLoading } = api.creator.getCreator.useQuery({
    id: props.id,
  });

  if (isLoading) return <div>Checking..</div>;
  if (data) {
    return (
      <div>
        <CreatPost id={props.id} />;
        <PostList id={props.id} />
      </div>
    );
  } else {
    return <CreateCreator id={props.id} />;
  }
}

function CreateCreator(props: { id: string }) {
  const makeCreatorMutation = api.creator.makeMeCreator.useMutation();

  return (
    <div>
      <p>You are not a creator</p>
      <button onClick={() => makeCreatorMutation.mutate({ id: props.id })}>
        Be a creator
      </button>
    </div>
  );
}
