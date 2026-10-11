import { motion } from "motion/react";
import { Loader2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { forwardRef, type ReactNode } from "react";

import { cn } from "~/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

// The filled variants are plain classes from arcade.css, not Tailwind
// gradient utilities — see the note above `.ar-key-primary` for why a
// gradient utility can't win against `.ar-key`'s `background` shorthand.
const VARIANTS: Record<Variant, string> = {
  primary: "ar-key ar-key-primary",
  gold: "ar-key ar-key-gold",
  danger: "ar-key ar-key-danger",
  outline: "ar-key text-ar-text",
  ghost:
    "border border-transparent bg-transparent text-ar-dim hover:bg-white/[0.06] hover:text-ar-text",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[12px] gap-1.5 rounded-[11px]",
  md: "h-11 px-4 text-[13.5px] gap-2 rounded-ar",
  lg: "h-[54px] px-6 text-[15px] gap-2.5 rounded-ar-lg",
};

interface BaseProps {
  /**
   * Work is in flight. Distinct from `disabled` on purpose: a disabled button
   * dims to 40% and reads as "you can't do this", which is the wrong message
   * for "this is happening". A busy button keeps its full weight, spins, and
   * says what it's doing.
   */
  busy?: boolean;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  block?: boolean;
  className?: string;
  children?: ReactNode;
}

const baseClass = (
  { variant = "outline", size = "md", block }: BaseProps,
  extra?: string,
) =>
  cn(
    "font-hud relative inline-flex select-none items-center justify-center whitespace-nowrap",
    "font-semibold uppercase tracking-[0.08em] transition-colors",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ar-green focus-visible:ring-offset-2 focus-visible:ring-offset-ar-bg",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    extra,
  );

/**
 * The app's button. A physical key-cap: it sits on a 3px plinth and travels
 * down onto it when pressed, so every tap has a mechanical acknowledgement
 * even before the network answers.
 */
export const ArButton = forwardRef<
  HTMLButtonElement,
  BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function ArButton(
  { variant, size = "md", icon: Icon, iconRight: IconRight, block, busy, className, children, ...rest },
  ref,
) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 19 : 16;
  return (
    <button
      ref={ref}
      // `aria-busy` rather than `disabled` so screen readers announce the work
      // instead of the control disappearing from the tab order mid-flow.
      aria-busy={busy ? true : undefined}
      className={cn(
        baseClass({ variant, size, block }, className),
        busy && "pointer-events-none",
      )}
      {...rest}
    >
      {busy ? (
        <Loader2 size={iconSize} strokeWidth={2.6} className="animate-spin" />
      ) : (
        Icon && <Icon size={iconSize} strokeWidth={2.3} />
      )}
      {children}
      {!busy && IconRight && <IconRight size={iconSize} strokeWidth={2.3} />}
    </button>
  );
});

/** Same surface, but a real anchor — so it gets prefetch and middle-click. */
export function ArLinkButton({
  href,
  variant,
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  block,
  className,
  children,
}: BaseProps & { href: string }) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 19 : 16;
  return (
    <Link href={href} className={baseClass({ variant, size, block }, className)}>
      {Icon && <Icon size={iconSize} strokeWidth={2.3} />}
      {children}
      {IconRight && <IconRight size={iconSize} strokeWidth={2.3} />}
    </Link>
  );
}

/**
 * Round control for the map rail — recenter, filter, QR. Icon-only, so the
 * accessible name has to come from `label`, which is also the tooltip.
 */
export function ArIconButton({
  icon: Icon,
  label,
  active,
  busy,
  className,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  busy?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "ar-glass relative flex h-11 w-11 items-center justify-center rounded-full",
        "text-ar-dim transition-colors hover:text-ar-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ar-green",
        active && "!border-ar-green/60 text-ar-green-hot ar-glow",
        className,
      )}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      <Icon
        size={19}
        strokeWidth={2.1}
        className={cn(busy && "animate-spin-slow")}
      />
    </motion.button>
  );
}
