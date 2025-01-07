import Image from "next/image";
import { Badge } from "~/components/shadcn/ui/badge";
import { Card, CardContent } from "~/components/shadcn/ui/card";
import { Pin, Gem } from 'lucide-react';

interface AssetViewProps {
  code?: string;
  thumbnail: string | null;
  isNFT?: boolean;
  isPinned?: boolean;
}

function AssetView({ code, thumbnail, isNFT = true, isPinned = false }: AssetViewProps) {
  return (
    <Card className="group relative overflow-hidden rounded-lg transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Image
            fill
            alt={code ?? "asset"}
            src={thumbnail ?? "https://app.wadzzo.com/images/loading.png"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="mb-2 truncate text-lg font-bold">{code}</p>
            <div className="flex gap-2">

              {isPinned ? (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  <Pin className="mr-1 h-3 w-3" />
                  PIN
                </Badge>
              ) : isNFT ?
                (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    <Gem className="mr-1 h-3 w-3" />
                    NFT
                  </Badge>
                ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AssetView;
