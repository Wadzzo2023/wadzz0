import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
export default function Logo({ className }: { className?: string }) {
  return (
    <div className="flex w-full items-center justify-center">
      <Link href="/" className="flex items-center gap-2 justify-center ">
        <div className=" flex items-center gap-2 justify-center ">
          <Image
            alt="Wadzzo logo"
            src="/images/logo.png"
            blurDataURL={"vongCong"}
            placeholder="blur"
            height={1000}
            width={1000}
            className="h-10 w-28 md:h-12 md:w-40 "
          />
        </div>
      </Link>

    </div>
  );
}
