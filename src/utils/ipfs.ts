const pinataGatewayUrl = "https://gateway.pinata.cloud";
export function ipfsHashToUrl(ipfsHash: string) {
  return `${pinataGatewayUrl}/ipfs/${ipfsHash}`;
}
export function urlToIpfsHash(url: string | null) {
  if (!url) {
    return undefined;
  }
  const match = url.match(/\/ipfs\/(.+)$/);
  return match ? match[1] : undefined;
}
