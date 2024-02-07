import { HomeIcon } from "lucide-react";
import React from "react";

export default function Button(props: { text: string; icon: React.ReactNode }) {
  return (
    <button className="btn">
      {props.icon}
      {props.text}
    </button>
  );
}
