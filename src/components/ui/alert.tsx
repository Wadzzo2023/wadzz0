import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import React from "react";

export default function Alert({
  type,
  content,
  className,
}: {
  className?: string;
  content: string;
  type?: "normal" | "warning" | "error" | "success" | "info";
}) {
  return (
    <div
      role="alert"
      className={clsx(
        className,
        "alert ",
        type == "warning" && "alert-warning",
        type == "error" && "alert-error",
        type == "success" && "alert-success",
        type == "info" && "alert-info",
      )}
    >
      <AlertTriangle />
      <span>{content}</span>
    </div>
  );
}
