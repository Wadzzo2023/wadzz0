import clsx from "clsx";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  height?: string;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { 'list': 'check' }, { indent: "-1" }, { indent: "+1" }],
    ["link",],
    ["clean"],
    ["code-block"],
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'direction': 'rtl' }],                         // text direction

  ],

}

export const Editor = ({
  onChange,
  value,
  height,
  placeholder,
}: EditorProps) => {
  const ReactQuill = dynamic(() => import("react-quill"));

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        className={clsx(
          height ? `h-[${height}]` : "h-[240px]"

        )}

        value={value}
        modules={modules}
        placeholder={placeholder}
        onChange={onChange}
      />

    </div>
  );
};
