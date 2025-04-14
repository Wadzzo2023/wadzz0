import Link from "next/link";
import Image from "next/image";
import { MARKET } from "~/lib/defaults";

export interface Market {
  title: string;
  link: string;
  logoImg?: LogoImg;
  color?: string;
}
export interface LogoImg {
  url: string;
  blurData: string | null;
}

export default function MarketLayout({ link, title }: Market) {
  let layoutData;

  switch (title.toLowerCase()) {
    case "litemint":
      layoutData = MARKET.litemint;
      break;
    case "stellarx":
      layoutData = MARKET.stellarX;
      break;
    case "stellarterm":
      layoutData = MARKET.stellarTerm;
      break;
  }

  if (!layoutData) return <></>;

  return (
    <Link
      href={link}
      target="_blank"
      style={{
        borderColor: layoutData?.color,
      }}
      className="btn btn-sm relative flex items-center justify-center overflow-hidden text-xs normal-case"
    >
      <div
        className="absolute h-full w-full opacity-20"
        style={{
          backgroundColor: layoutData?.color,
        }}
      />
      <Image
        blurDataURL={layoutData?.logoImg.blurData}
        placeholder={"blur"}
        className="rounded-box"
        height={20}
        width={20}
        src={layoutData?.logoImg.url}
        alt={title}
      />
      <div className="font-bold tracking-wider ">{title}</div>
    </Link>
  );
}
