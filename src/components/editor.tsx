import clsx from "clsx";
import dynamic from "next/dynamic";

import "react-quill/dist/quill.snow.css";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const Editor = ({ onChange, value }: EditorProps) => {
  const ReactQuill = dynamic(() => import("react-quill"));

  return (
    <div className="">
      <ReactQuill
        theme="snow"
        className="py-5"
        value={value}
        style={{ height: "250px" }}
        placeholder=""
        onChange={onChange}
      />
    </div>
  );
};
