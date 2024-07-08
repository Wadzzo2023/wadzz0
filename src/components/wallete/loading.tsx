import { ShieldAlert } from "lucide-react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";

interface LoadingProps {
  className?: string;
  text?: string;
}

export default function Loading({ className, text }: LoadingProps) {
  return (
    <div
      className={twMerge(
        "flex h-screen items-center justify-center ",
        className,
      )}
    >
      <div className="flex items-center  justify-center">
        {text && <div className="mb-2 text-xs tracking-wider">{text}</div>}
        {text && text.toLowerCase() === "empty" ? (
          <ShieldAlert className="mx-2" />
        ) : (
          <>
            <Image
              className="h-20 w-20"
              height={100}
              width={100}
              src={"/favicon.ico"}
              alt={PLATFROM_ASSET.code}
            />
            <span className="loading" />
          </>
        )}
      </div>
    </div>
  );
}
