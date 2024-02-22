import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { LOGO_BLURDATA } from "~/lib/defaults";
export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className="flex cursor-alias items-center justify-center gap-2  "
    >
      <Image
        height={28}
        width={28}
        alt="BandCoin logo"
        src="/images/bandcoin-logo.png"
        blurDataURL={LOGO_BLURDATA}
      />
      <h1
        className={twMerge(
          " relative text-2xl font-bold capitalize  text-white",
          className,
        )}
      >
        BANDCOIN
        <p className="absolute right-0 top-0 -mr-4 -mt-1 text-xs">TM</p>
      </h1>
    </Link>
  );
}
