import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { PLATFROM_ASSET } from "~/lib/stellar/fan/constant";
export default function Logo({ className }: { className?: string }) {
  return (
    <div className="flex w-full items-center justify-center">
      <Link href="/" className="btn btn-ghost flex items-center gap-2">
        <div className="relative h-12 w-40">
          <Image
            alt="Wadzzo logo"
            src="/images/logo.png"
            blurDataURL={"vongCong"}
            placeholder="blur"
            fill
          />
        </div>
      </Link>
    </div>
  );
}
