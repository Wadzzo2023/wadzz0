import { Skeleton } from "~/components/shadcn/ui/skeleton"

export function SessionItemSkeleton() {
    return (
        <div className="p-3 rounded-lg border border-transparent space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-3/4 rounded" />
            {/* Subtitle/Message count skeleton */}
            <Skeleton className="h-3 w-1/2 rounded" />
        </div>
    )
}

export function SessionListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2 px-1">
            {Array.from({ length: count }).map((_, i) => (
                <SessionItemSkeleton key={i} />
            ))}
        </div>
    )
}
