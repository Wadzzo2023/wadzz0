import { ShieldAlert } from 'lucide-react';
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
        "flex h-full items-center justify-center",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center">
        {text && (
          <div className="mb-2 text-sm font-medium tracking-wider text-gray-600">
            {text}
          </div>
        )}
        {text && text.toLowerCase() === "empty" ? (
          <ShieldAlert className="mx-2 h-12 w-12 text-gray-400" />
        ) : (
          <>
            <Image
              className="h-20 w-20"
              height={80}
              width={80}
              src="/favicon.ico"
              alt="Loading"
            />
            <div className="mt-4 h-2 w-20 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-full animate-pulse rounded-full bg-blue-500"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

