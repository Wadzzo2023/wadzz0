"use client";

import { Pencil, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";

interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    isActive?: boolean;   // controls Pause vs Resume
    size?: "sm" | "xs";
    isSlate?: boolean;  // whether this button group is rendered in a "slate" style (used for all but the last block in a message)
}

export function ActionButtons({
    onEdit, onDelete, onPause, onResume, isActive, size = "sm", isSlate = false,
}: ActionButtonsProps) {
    const cls = size === "xs"
        ? "h-6 px-2 text-[10px] gap-1"
        : "h-7 px-3 text-[11px] gap-1.5";

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {onEdit && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    disabled={isSlate}
                    className={`${cls} font-semibold`}
                >
                    <Pencil className="w-3 h-3" />
                    Edit
                </Button>
            )}

            {(onPause ?? onResume) && (
                isActive ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPause}
                        disabled={isSlate}
                        className={`${cls} font-semibold text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50`}
                    >
                        <PauseCircle className="w-3 h-3" />
                        Pause
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResume}
                        disabled={isSlate}
                        className={`${cls} font-semibold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50`}
                    >
                        <PlayCircle className="w-3 h-3" />
                        Resume
                    </Button>
                )
            )}

            {onDelete && (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isSlate}
                    onClick={onDelete}
                    className={`${cls} font-semibold text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50`}
                >
                    <Trash2 className="w-3 h-3" />
                    Delete
                </Button>
            )}
        </div>
    );
}