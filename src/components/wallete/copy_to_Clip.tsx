import { Copy } from "lucide-react";
import { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { addrShort, delay } from "~/lib/utils";

interface CopyToClipProps {
  text: string;
  collapse?: number;
}

function CopyToClip({ text, collapse }: CopyToClipProps) {
  const [press, setPress] = useState(false);

  const onCopy = async () => {
    setPress(true);
    toast.success(`Copied: ${collapse ? addrShort(text, collapse) : text}`);
    await delay(1000);
    setPress(false);

    return;
  };

  return (
    <span className="tooltip tooltip-left" data-tip={press ? "Copied" : "Copy"}>
      <CopyToClipboard text={text} onCopy={() => void onCopy()}>
        <button className="btn btn-xs !m-0 bg-transparent !p-1">
          <Copy size={13} />
        </button>
      </CopyToClipboard>
    </span>
  );
}

export default CopyToClip;
