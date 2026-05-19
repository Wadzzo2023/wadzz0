"use client";

interface SectionHeaderProps {
    label: string;
    count?: number;
    icon?: string;
}

export function SectionHeader({ label, count, icon }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-1.5">
            {icon && <span className="text-sm">{icon}</span>}
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {label}
            </span>
            {count != null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-semibold">
                    {count}
                </span>
            )}
        </div>
    );
}