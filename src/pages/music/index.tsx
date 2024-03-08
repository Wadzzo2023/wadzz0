import { Song } from "@prisma/client";
import Head from "next/head";
import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import AlbumSection from "~/components/music/album/section";
import TrackSection from "~/components/music/track/section";
import { api } from "~/utils/api";

export default function Home() {
  const { isAva } = useConnectWalletStateStore();
  const albums = api.music.album.getAll.useQuery();

  const publicSongs = [] as Song[];
  const mySong = [] as Song[];
  const safeAllsong = [] as Song[];

  function conditionalRender() {
    if (isAva) {
      if (mySong.length > 0) {
        return (
          <div className="py-4">
            <TrackSection header="Your songs" />
          </div>
        );
      }
    } else {
      return (
        <div>
          <ConnectWalletButton />
        </div>
      );
    }
  }

  return (
    <>
      <Head>
        <title>MUSIC APP - Home</title>
        {/* <meta name="description" content={env.NEXT_PUBLIC_DESC} /> */}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col gap-5 ">
        <div className="mt-4 w-full">
          {/* {banner ? (
            <div className=" w-full">
              <div
                className="relative w-full rounded-2xl bg-gradient-to-r from-base-300 via-base-100 to-base-300"
                style={{ height: height ? height / 2 : "45vh" }}
              >
                <Image
                  alt="Banner"
                  src={banner.imgUrl}
                  fill
                  className="rounded-2xl  object-scale-down md:object-contain"
                />
              </div>
            </div>
          ) : (
            <div className=" rounded-2xl bg-base-300"></div>
          )} */}
        </div>
        {albums.data && (
          <div>
            <h3 className="py-4 text-2xl font-bold">ALBUMS</h3>
            <AlbumSection albums={albums.data} />
          </div>
        )}

        <TrackSection header="Recently added song" />
        {conditionalRender()}

        <TrackSection header="Public songs" />

        <div className="h-60"></div>
      </div>
    </>
  );
}
