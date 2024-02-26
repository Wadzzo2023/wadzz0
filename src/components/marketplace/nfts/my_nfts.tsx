import { ConnectWalletButton } from "package/connect_wallet";
import { useEffect, useRef, useState } from "react";
import { useConnectWalletStateStore } from "package/connect_wallet/src/state/connect_wallet_state";
import { useNftStore } from "~/lib/states/nfts";
import { useRightStore } from "~/lib/states/right";
import { useBalanceStore } from "~/lib/states/storageAcc";
import { api } from "~/utils/api";
import MyError from "../my_error";
import NftItem from "./nft_item";

export default function MyNfts() {
  const divRef = useRef<HTMLDivElement>(null);

  const [isWalletAva, setIsWalletAva] = useState(false);
  const { isAva, pubkey } = useConnectWalletStateStore();
  const { setRightData: setLeftData } = useRightStore();
  const { userAssetsCodeIssuer } = useBalanceStore();
  const { setUserNfts, userNfts } = useNftStore();

  // const { data: userNfts, isLoading } = api.user.getUserNfts.useQuery(
  //   { pubkey },
  //   {
  //     onSuccess(data) {
  //       // if (data.length > 0) setLeftData(data[0] as MarketNFT);
  //       setUserNFTs(data as MarketNFT[]);
  //     },
  //   },
  // );

  const { data: tomlData, isLoading } = api.nft.getToml.useQuery(undefined, {
    onSuccess(data) {
      if (data) {
        const codeIssuer = Object.keys(data);
        const userItemsCodeIssuer = codeIssuer.filter((el) =>
          userAssetsCodeIssuer.includes(el),
        );
        // get the items with asset code and issuer.
        setUserNfts(userItemsCodeIssuer);
      }
    },
  });

  useEffect(() => {
    setIsWalletAva(isAva);
  }, [isAva]);

  return isWalletAva ? (
    <>
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        ref={divRef}
        className="main-asset-area py-2"
      >
        {isLoading
          ? [0, 1, 2, 3].map((el) => (
              <div key={el} className="skeleton h-36 w-full"></div>
            ))
          : userNfts
              .filter((e) => e.copies > 0)
              .map((item, i) => <NftItem key={i} item={item} />)}
      </div>
      <div className="flex  h-full items-center  justify-center">
        {userNfts.length === 0 && !isLoading && (
          <MyError text="No assets found on account." />
        )}
      </div>
    </>
  ) : (
    <div className="flex  h-full items-center  justify-center">
      <ConnectWalletButton />
    </div>
  );
}
