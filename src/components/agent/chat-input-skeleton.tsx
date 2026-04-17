import { Skeleton } from "~/components/shadcn/ui/skeleton"

export function ChatInputSkeleton() {
    return (
        <div className="flex gap-2 items-center p-4 border-t">
            {/* Buttons skeleton */}
            <Skeleton className="h-10 w-10 rounded" />

            {/* Input skeleton */}
            <Skeleton className="h-10 flex-1 rounded" />

            {/* Send button skeleton */}
            <Skeleton className="h-10 w-10 rounded" />
        </div>
    )
}
