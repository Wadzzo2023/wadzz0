import AlbumCover from "~/components/music/album/cover";
import SongList from "~/components/music/album/table";
import SongCreate from "~/components/music/modal/song_create";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ModalMode } from "~/components/music/modal/modal_template";
import { useEffect, useState } from "react";
import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import log from "~/lib/logger/logger";
import { api } from "~/utils/api";
import Alert from "~/components/ui/alert";

export default function AlbumPageWrapper() {
  const router = useRouter();
  const albumId = router.query.album;
  if (typeof albumId == "string") {
    return <AlbumPage albumId={Number(albumId)} />;
  } else {
    log.info("albumId", albumId);
    log.info("query: ", router.query);
    return (
      <div>
        <p> Loading to get albumId </p>
      </div>
    );
  }
}
export function AlbumPage({ albumId }: { albumId: number }) {
  const { status } = useSession();
  const walletState = useConnectWalletStateStore();
  const [isWalletAva, setIsWalletAva] = useState(false);

  const album = api.music.album.getById.useQuery({ albumId });

  useEffect(() => {
    setIsWalletAva(walletState.isAva);
  }, [walletState.isAva]);

  const logicalRender = () => {
    if (status === "authenticated" && album.data) {
      return (
        <>
          <SongCreate mode={ModalMode.ADD} albumId={albumId} />
          {album.data.Song.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold">Songs</h3>
              <SongList albumId={albumId} songs={album.data.Song} />
            </div>
          )}
        </>
      );
    } else {
      if (isWalletAva) {
        // return pubSongs.length ? (
        //   <SongList albumId={albumId} songs={pubSongs} />
        // ) : (
        //   <p>There are no available song</p>
        // );
      } else {
        return <ConnectWalletButton />;
      }
    }
  };

  if (album.data && album.data.Song) {
    return (
      <div className="">
        <AlbumCover album={album.data} songNumber={album.data.Song.length} />
        {logicalRender()}
      </div>
    );
  } else {
    return (
      <div className="mt-10">
        <Alert type="info" content="This Album does not exist" />
      </div>
    );
  }
}
