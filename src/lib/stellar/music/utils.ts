/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

export function concatAssetWithIssuer(
  asset_code: string,
  asset_issuer: string,
): string {
  return `${asset_code}-${asset_issuer}`;
}

export function getAssetIssuerFromConcat(
  concatenatedStr: string,
): [string, string] {
  const parts = concatenatedStr.split("-");
  if (parts.length === 2) {
    return [parts[0]!, parts[1]!];
  } else {
    throw new Error("Invalid format: The string does not contain a hyphen.");
  }
}
