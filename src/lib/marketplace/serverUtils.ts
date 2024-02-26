import { getPlaiceholder } from "plaiceholder";
import { parse } from "path";
import { getRandomColorHex } from "colors-helper-tools";
import { type AssetType } from "./interfaces";
import { type AssetData } from "~/pages/api/add-asset";
import { joinCodeIssuer } from "./helper/helper_client";

export function getFileExtSSR(urlinput: string) {
  const url = new URL(urlinput);
  if (!url.pathname) {
    return "";
  }
  const { ext } = parse(url.pathname);
  const woExt = ext.replace(".", "");
  return woExt;
}

export async function getBlurData(imgUrl: string, isUrl = true) {
  if (isUrl && getFileExtSSR(imgUrl) === "gif") {
    return null;
  }

  try {
    const { base64 } = await getPlaiceholder(imgUrl);
    return base64;
  } catch (e) {
    // log.error( e);
    return null;
  }
}

export async function addColorBlur({
  logoUrl,
  code,
  issuer,
  description,
  link,
  litemint,
  stellarterm,
  stellarx,
  tags,
}: AssetData): Promise<AssetType> {
  const data: AssetType = {
    code,
    issuer,
    link,
    tags,
    description,
    codeIssuer: joinCodeIssuer({ code, issuer }),
    logoImg: {
      url: logoUrl,
      blurData: await getBlurData(logoUrl),
    },
    availableMarket: [],
    color: getRandomColorHex(),
  };
  if (litemint && litemint.length != 0) {
    data.availableMarket.push({
      title: "Litemint",
      link: litemint,
    });
  }
  if (stellarterm && stellarterm.length != 0) {
    data.availableMarket.push({
      title: "StellarTerm",
      link: stellarterm,
    });
  }
  if (stellarx && stellarx.length != 0) {
    data.availableMarket.push({
      title: "StellarX",
      link: stellarx,
    });
  }

  return data;
}
