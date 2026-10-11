const pinataGatewayUrl = "https://gateway.pinata.cloud";

const ipfsUrl = "https://ipfs.io/ipfs";

export function ipfsHashToUrl(ipfsHash: string) {
  return `${ipfsUrl}/${ipfsHash}`;
}

export function ipfsHashToPinataGatewayUrl(ipfsHash: string) {
  return `${pinataGatewayUrl}/ipfs/${ipfsHash}`;
}
export function urlToIpfsHash(url: string | null) {
  if (!url) {
    return undefined;
  }
  const match = /\/ipfs\/(.+)$/.exec(url);
  return match ? match[1] : undefined;
}
