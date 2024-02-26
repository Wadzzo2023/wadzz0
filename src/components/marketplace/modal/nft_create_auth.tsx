import { useSession } from "next-auth/react";
import React from "react";
import NFTCreate, { NFTCreateProps } from "./nft_create";

function NFTCreateWithAuth(props: NFTCreateProps) {
  const { status } = useSession();
  if (status == "authenticated") return <NFTCreate {...props} />;
}

export default NFTCreateWithAuth;
