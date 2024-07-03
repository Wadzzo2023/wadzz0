import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { PLATFROM_ASSET } from "~/lib/stellar/constant";
export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className="flex cursor-alias items-center justify-center gap-2  "
    >
      <div className="btn btn-ghost">
        <div className="relative h-12 w-11">
          <Image fill={true} alt="logo" src="/images/logo.png" />
        </div>
        <h1
          className={twMerge(
            "relative text-4xl font-bold capitalize  text-white",
            className,
          )}
        >
          {PLATFROM_ASSET.code}
          <p className="absolute right-0 top-0 -mr-4 -mt-1 text-xs">TM</p>
        </h1>
      </div>
    </Link>
  );
}
