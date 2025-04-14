import Link from "next/link";

export const AssetBadge = ({
  asset,
}: {
  asset: { code: string; issuer: string };
}) => {
  if (asset)
    return (
      <Link
        href={`https://stellar.expert/explorer/public/asset/${asset.code}-${asset.issuer}`}
      >
        <div className="badge badge-primary">{asset.code}</div>
      </Link>
    );
};
