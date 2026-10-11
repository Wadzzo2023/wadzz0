import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";

export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

/**
 * ── SegmentedTabs ──────────────────────────────────────────────────────────
 *
 * A pill switch between mutually-exclusive views — All/Following on the
 * brand list, Live drops/Your cards on a brand's page.
 *
 * The active segment is one `motion.span` carrying a shared `layoutId`
 * rather than each button separately toggling its own background. That's
 * the same technique `BottomTabBar` uses for its lit plate: switching tabs
 * slides one highlight across the bar instead of two segments
 * independently swapping colour, which is what makes the tab bar feel like
 * a physical selector and is exactly what this control was missing —
 * flipped straight from "flat text" to "flat text with a tint," with
 * nothing in between to look at.
 *
 * `layoutId` must be unique per rendered instance. Two segmented controls
 * on screen sharing one id would animate a switch on the other whenever
 * either changes, since framer-motion treats a shared id as one element
 * moving between mount points.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  layoutId,
  className,
}: {
  tabs: SegmentedTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div className={cn("ar-bevel flex h-11 gap-1 rounded-ar p-1", className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className="relative flex-1"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[10px] border border-ar-green/40 bg-ar-green/16"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px -4px hsl(var(--ar-green) / 0.75)",
                }}
                transition={{ type: "spring", stiffness: 460, damping: 34, mass: 0.7 }}
              />
            )}

            <span
              className={cn(
                "font-hud relative z-10 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                active ? "text-ar-green-hot" : "text-ar-faint",
              )}
            >
              {Icon && <Icon size={12} strokeWidth={2.4} />}
              <span className="truncate">{tab.label}</span>
              {tab.count != null && (
                <span
                  className={cn(
                    "font-hud inline-flex h-[17px] min-w-[19px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold tabular-nums transition-colors",
                    active
                      ? "bg-ar-green-hot/20 text-ar-green-hot"
                      : "bg-white/[0.07] text-ar-faint",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
