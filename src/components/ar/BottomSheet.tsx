import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { type ReactNode, useEffect } from "react";

import { cn } from "~/lib/utils";

/**
 * The app's one overlay primitive. Everything that isn't a full screen — pin
 * details, filters, directions, the login gate — arrives as a sheet from the
 * bottom, because that's the only edge a thumb owns.
 *
 * Dragging down past 90px (or flicking) dismisses. The drag is elastic in one
 * direction only, so the sheet can't be pulled up off its own header.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  /** Drop the grabber + drag when the sheet is a required decision. */
  dismissible = true,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
  labelledBy?: string;
}) {
  // Escape closes, matching the drag affordance for keyboard and desktop.
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 620) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex items-end">
          <motion.div
            aria-hidden
            onClick={dismissible ? onClose : undefined}
            className="absolute inset-0 bg-ar-void/75 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={cn(
              "ar-glass relative w-full rounded-t-ar-xl border-b-0 pb-[max(18px,var(--ar-safe-bottom))]",
              "max-h-[86%] overflow-hidden",
              className,
            )}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.9 }}
            drag={dismissible ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={handleDragEnd}
          >
            {dismissible && (
              <div className="flex justify-center pb-1 pt-2.5">
                <span className="h-[4px] w-9 rounded-full bg-ar-line-bright" />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
