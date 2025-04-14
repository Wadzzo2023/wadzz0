export function truncateString(str: string, firstFew = 3, lastFew = 3): string {
  if (str.length <= firstFew + lastFew) {
    // No need to truncate, the string is already shorter than the specified length
    return str;
  }

  const truncatedString = str.slice(0, firstFew) + "..." + str.slice(-lastFew);
  return truncatedString;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}
