const pinataGatewayUrl = "https://gateway.pinata.cloud";
export function ipfsHashToUrl(ipfsHash: string) {
  return `${pinataGatewayUrl}/ipfs/${ipfsHash}`;
}
