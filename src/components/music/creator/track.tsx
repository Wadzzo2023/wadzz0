import Image from "next/image";
import { EllipsisVerticalIcon, PlayIcon } from "@heroicons/react/24/solid";
import { TrackItemType, usePlayerStore } from "~/lib/state/music/track";
import { ReactNode } from "react";
import { usePlayer } from "~/components/context/PlayerContext";
import { AssetType, SongItemType, useModal } from "~/lib/state/play/use-modal-store";
import { api } from "~/utils/api";
import { Button } from "~/components/shadcn/ui/button";
import { MoreVertical, ShoppingCartIcon, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
type AssetWithArtist = AssetType & {
  artist: string;
};


function CreatorTrack({
  item,
  playable,
  adminId
}: {
  item: SongItemType;
  assetItem?: AssetType;
  playable?: boolean;
  buyModal?: ReactNode;
  index: number;
  adminId?: string;
}) {


  const song = api.music.song.getAsong.useQuery({ songId: item.id });

  const { onOpen } = useModal();
  const trackUrlStore = usePlayerStore();
  const { setCurrentTrack, setCurrentAudioPlayingId, setIsPlaying } = usePlayer();
  const session = useSession()

  const admin = api.wallate.admin.checkAdmin.useQuery();
  const DeleteMutation = api.music.song.deletePublicSong.useMutation({
    onSuccess: () => {
      toast.success("Song deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },

  });

  function handleDeleteSong(id: number) {
    DeleteMutation.mutate({ songId: id });
  }
  console.log(item.asset.creatorId, session.data?.user?.id, admin.data?.id)

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={item.asset.thumbnail}
          layout="fill"
          objectFit="cover"
          alt={`${item.asset.code} cover`}
          className="transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">

          <Button
            onClick={() => {
              setCurrentAudioPlayingId(item.id);
              setCurrentTrack(item);
              setIsPlaying(true);
            }}
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            <PlayIcon className="h-6 w-6" />
          </Button>

        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{item.asset.name}</h3>
          {
            (session.data?.user?.id === item.asset.creatorId || admin.data?.id) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem
                    onClick={() => handleDeleteSong(item.id)}

                    className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        </div>
        <p className="mt-1 text-sm text-gray-600 truncate">{item.artist}</p>
      </div>
    </div>
  );
}

export default CreatorTrack;
