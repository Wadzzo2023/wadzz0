import Link from "next/link";
import { SongAsset } from "~/lib/types/dbTypes";

export const AssetBadge = ({ asset }: { asset: SongAsset }) => {
  if (asset)
    return (
      <Link
        href={`https://stellar.expert/explorer/public/asset/${asset.code}-${asset.issuer.pub}`}
      >
        <div className="badge badge-primary">{asset.code}</div>
      </Link>
    );
};
