import { ShieldAlert } from "lucide-react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

interface LoadingProps {
  className?: string;
  text?: string;
}

export default function Loading({ className, text }: LoadingProps) {
  return (
    <div
      className={twMerge(
        "rounded-box flex h-full w-full animate-pulse items-center justify-center bg-base-200",
        className,
      )}
    >
      {text ? <div className="text-xs tracking-wider">{text}</div> : <></>}
      {text && text.toLowerCase() === "empty" ? (
        <>
          <ShieldAlert className="mx-2" />
        </>
      ) : (
        <>
          <Image height={80} width={80} src={"/favicon.ico"} alt="Bandcoin" />
          <span className="loading" />
        </>
      )}
    </div>
  );
}
