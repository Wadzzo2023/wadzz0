import React from "react";

export default function CollapseSible({
  summary,
  content,
}: {
  summary: string;
  content: string;
}) {
  return (
    <details className="collapse bg-base-200">
      <summary className="collapse-title text-xl font-medium">
        {summary}
      </summary>
      <div className="collapse-content">
        <p>{content}</p>
      </div>
    </details>
  );
}
