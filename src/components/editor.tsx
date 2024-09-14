import clsx from "clsx";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  height?: string;
  placeholder?: string;
}

export const Editor = ({
  onChange,
  value,
  height,
  placeholder,
}: EditorProps) => {
  const ReactQuill = dynamic(() => import("react-quill"));

  return (
    <div className="">
      <ReactQuill
        className={clsx(height ? `h-[${height}]` : "h-[240px]")}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
};
