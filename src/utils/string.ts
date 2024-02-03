export function truncateString(
  str: string,
  firstFew: number = 3,
  lastFew: number = 3,
): string {
  if (str.length <= firstFew + lastFew) {
    // No need to truncate, the string is already shorter than the specified length
    return str;
  }

  const truncatedString = str.slice(0, firstFew) + "..." + str.slice(-lastFew);
  return truncatedString;
}
