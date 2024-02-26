import Head from "next/head";
import Image from "next/image";
import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import AlbumSection from "~/components/music/album/section";
import TrackSection from "~/components/music/track/section";
import { env } from "~/env";
import { useAlbumStore } from "~/lib/state/music/album";
import { useContentWidthStore } from "~/lib/state/music/content_width";
import { api } from "~/utils/api";

export default function Home() {
  const { isAva } = useConnectWalletStateStore();
  const { height } = useContentWidthStore();
  const { data: banner } = api.music.banner.get.useQuery();

  const albums = useAlbumStore((state) => state.albums);
  const publicSongs = [];
  const mySong = [];
  const safeAllsong = [];

  function conditionalRender() {
    if (isAva) {
      if (mySong.length > 0) {
        return (
          <div className="py-4">
            <TrackSection header="Your songs" songs={mySong} />
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
          {banner ? (
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
          )}
        </div>
        {albums && (
          <div>
            <h3 className="py-4 text-2xl font-bold">ALBUMS</h3>
            <AlbumSection albums={albums} />
          </div>
        )}

        <TrackSection
          itemsPerPage={5}
          header="Recently added song"
          songs={safeAllsong}
        />
        {conditionalRender()}

        <TrackSection header="Public songs" songs={publicSongs} />

        <div className="h-60"></div>
      </div>
    </>
  );
}
