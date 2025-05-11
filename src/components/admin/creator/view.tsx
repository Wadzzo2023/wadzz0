import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/shadcn/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "~/components/shadcn/ui/avatar";

export type Creator = {
  id: string;
  joinedAt: Date;
  profileUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  name: string;
  backgroundSVG?: string | null;
  showSVG: boolean;
  vanityURL?: string | null;
  storagePub: string;
  pageAsset: {
    code: string;
    thumbnail: string | null;
  } | null;
};

interface CreatorDialogProps {
  creator: Creator;
}

export function CreatorDialog({ creator }: CreatorDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{creator.name}</DialogTitle>
          <DialogDescription>
            Joined: {creator.joinedAt.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Avatar className="mx-auto mb-4 h-24 w-24">
            <AvatarImage
              src={creator.profileUrl ?? undefined}
              alt={creator.name}
            />
            <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
          </Avatar>

          {creator.bio && (
            <p className="mb-2 text-sm text-gray-700">{creator.bio}</p>
          )}

          {creator.pageAsset && (
            <>
              <h3 className="mb-2 mt-4 font-semibold">Page Asset</h3>
              <p className="text-sm">Code: {creator.pageAsset.code}</p>
              {/* <p className="text-sm">Thumbnail:</p> */}
              <Avatar className="mx-auto mb-4 h-24 w-24">
                <AvatarImage
                  src={creator.pageAsset.thumbnail ?? undefined}
                  alt={creator.name}
                />
                {/* <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback> */}
              </Avatar>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
