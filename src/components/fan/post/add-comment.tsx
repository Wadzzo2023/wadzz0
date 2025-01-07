import { zodResolver } from "@hookform/resolvers/zod";
import { Comment } from "@prisma/client";
import { Send } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/utils/api";
import CommentView from "./comment";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/shadcn/ui/form";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Button } from "~/components/shadcn/ui/button";

export const CommentSchema = z.object({
  postId: z.number(),
  parentId: z.number().optional(),
  content: z
    .string()
    .min(1, { message: "Minimum 5 character is required!" })
    .trim(),
});
export type CommentSchemaType = z.infer<typeof CommentSchema>;

export function AddComment({ postId }: { postId: number }) {

  const commentMutation = api.fan.post.createComment.useMutation({
    onSuccess: () => {
      form.reset();
    },
  });

  const form = useForm<CommentSchemaType>({
    resolver: zodResolver(CommentSchema),
    defaultValues: { postId, content: "" },
  });

  const onSubmit: SubmitHandler<CommentSchemaType> = (data) => {
    commentMutation.mutate(data);
  };

  return (
    <div className=" px-4 pb-2 ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <textarea
                      {...field}
                      rows={1}
                      placeholder="Write your comment..."
                      className="textarea textarea-bordered h-10 w-full"
                    />
                    <Button
                      type="submit"
                      disabled={commentMutation.isLoading || !field.value.trim()}
                    >
                      {commentMutation.isLoading ? (
                        <span className="loading loading-spinner h-5 w-5" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Comment
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
