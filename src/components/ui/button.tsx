import { HomeIcon } from "lucide-react";
import React from "react";

export default function Button(props: { text: string }) {
  return (
    <button className="btn">
      <HomeIcon className="h-5 w-5" />
      {props.text}
    </button>
  );
}
