import { differenceInHours, formatDistanceToNowStrict } from "date-fns";

import type { Tone } from "~/ui/status-pill";
import type { RouterOutputs } from "~/utils/api";

/**
 * One place that turns the bounty router's facts into the words and tones the
 * UI shows, so a bounty reads the same on a card, the detail header and the
 * action panel.
 */

export type BountyCardData = RouterOutputs["bounty"]["list"]["items"][number];
export type BountyDetail = RouterOutputs["bounty"]["byId"];
export type EntryStatus = NonNullable<BountyCardData["viewer"]["latestEntryStatus"]>;

/** The review states the brand moves an entry through, in the fan's words. */
export const ENTRY_STATUS: Record<EntryStatus, { label: string; tone: Tone }> = {
  UNCHECKED: { label: "Sent", tone: "neutral" },
  CHECKED: { label: "Seen", tone: "info" },
  ONREVIEW: { label: "In review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Not selected", tone: "danger" },
};

/** The one badge for where the viewer stands on a bounty. */
export function viewerBadge(b: Pick<BountyCardData, "viewer" | "open">): { label: string; tone: Tone } {
  if (b.viewer.won) return { label: "You won", tone: "warning" };
  if (b.viewer.latestEntryStatus) return ENTRY_STATUS[b.viewer.latestEntryStatus];
  if (!b.open) return { label: "Closed", tone: "neutral" };
  if (b.viewer.joined) return { label: "Joined", tone: "primary" };
  return { label: "Open", tone: "success" };
}

export const formatUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 10 ? 2 : 0 });

export const formatTokens = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** "3 days left", "5 hours left", "Ended" — or null without an end date. */
export function deadlineLabel(endDate: Date | string | null) {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (end.getTime() <= Date.now()) return { text: "Ended", urgent: false };
  return { text: `${formatDistanceToNowStrict(end)} left`, urgent: differenceInHours(end, new Date()) < 48 };
}

/** Share of winner spots already filled (0–100). */
export const spotsFilled = (b: Pick<BountyCardData, "spotsLeft" | "totalWinners">) =>
  b.totalWinners > 0 ? Math.round(((b.totalWinners - b.spotsLeft) / b.totalWinners) * 100) : 0;
