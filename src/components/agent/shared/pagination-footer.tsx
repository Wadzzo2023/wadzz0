"use client";

import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import type { PaginationMeta } from "~/types/agent/types";

interface PaginationFooterProps {
    pagination: PaginationMeta | null | undefined;
    onLoadMore: (nextOffset: number) => void;
    isLoading: boolean;
    entityLabel?: string;
    isSlate?: boolean;  // whether this block is rendered in a "slate" style (used for all but the last block in a message)
}

export function PaginationFooter({
    pagination, onLoadMore, isLoading, entityLabel = "items",
    isSlate = false
}: PaginationFooterProps) {
    if (!pagination) return null;

    const loadedSoFar = pagination.offset + pagination.limit;
    const remaining = Math.max(0, pagination.total - loadedSoFar);

    return (
        <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-[11px] text-muted-foreground">
                Showing {pagination.showing}
            </p>

            {pagination.hasMore && pagination.nextOffset != null && (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading || isSlate}
                    onClick={() => onLoadMore(pagination.nextOffset!)}
                    className="w-full h-9 text-xs font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/10"
                >
                    {isLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                    ) : (
                        <>
                            Load {Math.min(pagination.limit, remaining)} more
                            ({remaining} remaining)
                            <ChevronDown className="w-3.5 h-3.5" />
                        </>
                    )}
                </Button>
            )}

            {!pagination.hasMore && pagination.total > pagination.limit && (
                <p className="text-[11px] text-muted-foreground italic">
                    All {pagination.total} {entityLabel} loaded
                </p>
            )}
        </div>
    );
}