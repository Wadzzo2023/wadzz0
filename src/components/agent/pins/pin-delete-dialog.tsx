"use client";

import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from "~/components/shadcn/ui/dialog";
import { fmt } from "~/lib/utils";

export interface DeleteTarget {
    id: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
}

interface PinDeleteDialogProps {
    targets: DeleteTarget[];
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}

export function PinDeleteDialog({
    targets, open, onConfirm, onCancel, isDeleting,
}: PinDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="text-red-400">⚠️</span>
                        Delete {targets.length > 1 ? `${targets.length} Pins` : "Pin"}
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-muted-foreground">
                        This will hide the pin{targets.length > 1 ? "s" : ""} from the map.
                        Collection data is preserved.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {targets.map((t) => (
                        <div
                            key={t.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-semibold text-foreground truncate">
                                    {t.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {fmt(t.startDate)} → {fmt(t.endDate)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 h-9 text-sm font-bold"
                    >
                        {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Confirm Delete
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-4 h-9 text-sm"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}