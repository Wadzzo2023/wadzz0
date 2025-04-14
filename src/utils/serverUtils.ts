import { getPlaiceholder } from "plaiceholder";
import { parse } from "path";

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
