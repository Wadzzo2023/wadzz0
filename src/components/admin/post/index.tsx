import React from "react";
import DeletePost from "./delete-post";

export default function PostDeleteComponent() {
  return (
    <div className="my-2   bg-base-100 p-10">
      <h2 className="py-2 text-lg font-bold">Delete Post</h2>
      Paste post id to delete a post
      <DeletePost />
    </div>
  );
}
