"use client";

import { Button } from "~/components/shadcn/ui/button";
import { api } from "~/utils/api";
import CustomAvatar from "~/components/ui/avater";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function TrendingSidebar() {
  const { data: sessionData } = api.auth.getSession.useQuery();
  const currentUserId = sessionData?.user?.id;
  
  const { data, isLoading } = api.fan.creator.getCreators.useQuery();
  const creators = data ?? [];

  const follow = api.fan.member.followCreator.useMutation({
    onSuccess: () => {
      toast.success("Creator Followed");
    },
    onError: (e) => toast.error("Failed to follow creator"),
  });

  const handleFollowClick = (creatorId: string) => {
    follow.mutate({ creatorId });
  };

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-2 p-2">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-[400px]">
      {creators.map((creator) => (
        <div key={creator.id} className="flex items-center justify-between gap-2 p-2 hover:bg-muted/50 rounded-lg transition-colors">
          <Link href={`/fans/creator/${creator.id}`} className="flex items-center gap-2 flex-1">
            <CustomAvatar url={creator.profileUrl} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{creator.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {creator._count?.followers ?? 0} followers
              </p>
            </div>
          </Link>
          {creator.id !== currentUserId && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleFollowClick(creator.id)}
              disabled={follow.isLoading}
              className="shrink-0"
            >
              {follow.isLoading && follow.variables?.creatorId === creator.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export function FollowedSidebar() {
  const { data: followedData, isLoading: isFollowedLoading } =
    api.fan.member.getFollowedCreators.useQuery({ limit: 10 });

  if (isFollowedLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-2 p-2">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const followedCreators = followedData?.items ?? [];

  if (followedCreators.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Follow creators to see their posts here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-[400px]">
      {followedCreators.map((item) => (
        <Link
          key={item.creatorId}
          href={`/fans/creator/${item.creatorId}`}
          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <CustomAvatar url={item.creator?.profileUrl ?? null} className="h-9 w-9" />
          <p className="font-medium text-sm truncate">{item.creator?.name}</p>
        </Link>
      ))}
    </div>
  );
}