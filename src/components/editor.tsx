import clsx from "clsx";
import dynamic from "next/dynamic";

import "react-quill/dist/quill.snow.css";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  height?: string;
}

export const Editor = ({ onChange, value, height }: EditorProps) => {
  const ReactQuill = dynamic(() => import("react-quill"));

  return (
    <div className="">
      <ReactQuill
        theme="snow"
        className={clsx(height ? `h-[80px] md:h-[${height}]` : "h-[240px]")}
        value={value}
        placeholder=""
        onChange={onChange}
      />
    </div>
  );
};
