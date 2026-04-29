import { Skeleton } from "~/components/shadcn/ui/skeleton"

export function ChatMessageSkeleton() {
    return (
        <div className="flex gap-3 mb-4">
            {/* Avatar skeleton */}
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

            {/* Message content skeleton */}
            <div className="flex-1 space-y-2 max-w-xl">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
            </div>
        </div>
    )
}

export function ChatMessageGroupSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <ChatMessageSkeleton key={i} />
            ))}
        </div>
    )
}
