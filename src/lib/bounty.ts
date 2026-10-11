import { differenceInHours, formatDistanceToNowStrict } from "date-fns";

import type { RouterOutputs } from "~/utils/api";

/**
 * ── Bounty display helpers ─────────────────────────────────────────────────
 *
 * One place that turns the router's facts into the words and tones the UI
 * shows, so a bounty's status reads the same on a list card, the detail
 * header and the pinned action bar.
 */

export type BountyCard = RouterOutputs["bounty"]["list"]["items"][number];
export type BountyDetail = RouterOutputs["bounty"]["byId"];
export type EntryStatus = NonNullable<
  BountyCard["viewer"]["latestEntryStatus"]
>;

export type Tone = "green" | "gold" | "danger" | "muted" | "info";

export const TONE_CLASS: Record<Tone, string> = {
  green: "border-ar-green/50 bg-ar-green/15 text-ar-green-hot",
  gold: "border-rarity-legendary/50 bg-rarity-legendary/15 text-rarity-legendary",
  danger: "border-ar-danger/50 bg-ar-danger/15 text-ar-danger",
  muted: "border-ar-line-bright bg-white/[0.05] text-ar-faint",
  info: "border-rarity-rare/50 bg-rarity-rare/15 text-rarity-rare",
};

/**
 * The review states wadzz0's brand-side screen moves an entry through, in
 * the fan's words. "Checked" there means the brand opened it.
 */
export const ENTRY_STATUS: Record<EntryStatus, { label: string; tone: Tone }> = {
  UNCHECKED: { label: "Sent", tone: "muted" },
  CHECKED: { label: "Seen", tone: "info" },
  ONREVIEW: { label: "In review", tone: "info" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Not selected", tone: "danger" },
};

/** The one badge a card shows for where *you* stand on it. */
export function viewerBadge(b: Pick<BountyCard, "viewer" | "open">): {
  label: string;
  tone: Tone;
} {
  if (b.viewer.won) return { label: "You won", tone: "gold" };
  if (b.viewer.latestEntryStatus) return ENTRY_STATUS[b.viewer.latestEntryStatus];
  if (!b.open) return { label: "Closed", tone: "muted" };
  if (b.viewer.joined) return { label: "Joined", tone: "green" };
  return { label: "Open", tone: "green" };
}

export const formatUsd = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 10 ? 2 : 0,
  });

export const formatAmount = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** "3d left", "5h left", "Ended" — or null when the bounty has no end date. */
export function deadlineLabel(endDate: Date | string | null) {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (end.getTime() <= Date.now()) return { text: "Ended", urgent: false };
  return {
    text: `${formatDistanceToNowStrict(end)} left`,
    urgent: differenceInHours(end, new Date()) < 48,
  };
}
