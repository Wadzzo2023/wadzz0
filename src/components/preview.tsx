import dynamic from "next/dynamic";

import "react-quill/dist/quill.bubble.css";

interface PreviewProps {
  value: string;
}

export const Preview = ({ value }: PreviewProps) => {
  const ReactQuill = dynamic(() => import("react-quill"));

  return (
    <ReactQuill className="m-0 p-0" theme="bubble" value={value} readOnly />
  );
};
