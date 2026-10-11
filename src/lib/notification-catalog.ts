import type { NotificationType } from "@prisma/client";

/**
 * What kinds of notification there are and how an inbox groups them. Shared by
 * the server (filters, grouping) and the screens (tabs). `brand` is the brand
 * inbox (isCreator rows), `fan` the fan inbox.
 */
export type InboxScope = "brand" | "fan";

export type InboxCategory = { id: string; label: string; types: NotificationType[] };

const BOUNTY_BRAND: NotificationType[] = ["BOUNTY_PARTICIPANT", "BOUNTY_SUBMISSION", "BOUNTY_COMMENT", "BOUNTY_REPLY", "BOUNTY_DOUBT", "BOUNTY_DOUBT_CREATE", "BOUNTY_DOUBT_REPLY", "BOUNTY_WINNER", "BOUNTY"];

export const CATEGORIES: Record<InboxScope, InboxCategory[]> = {
  brand: [
    { id: "sales", label: "Sales", types: ["ITEM_SOLD", "ROYALTY_EARNED", "ITEM_SOLD_OUT"] },
    { id: "community", label: "Community", types: ["FOLLOW", "SUBSCRIPTION", "LIKE", "COMMENT", "REPLY"] },
    { id: "bounties", label: "Bounties", types: BOUNTY_BRAND },
    { id: "drops", label: "Drops", types: ["PIN_COLLECTED", "GIFT_CLAIMED"] },
  ],
  fan: [
    { id: "following", label: "From brands", types: ["POST", "BOUNTY", "SHOP_ASSET"] },
    { id: "replies", label: "Replies", types: ["COMMENT", "REPLY", "BOUNTY_COMMENT", "BOUNTY_REPLY", "BOUNTY_DOUBT_CREATE", "BOUNTY_DOUBT_REPLY"] },
    { id: "wallet", label: "Wallet", types: ["ITEM_PURCHASED", "RESALE_SOLD", "GIFT_RECEIVED"] },
    { id: "bounties", label: "Bounties", types: ["BOUNTY_WINNER"] },
  ],
};

/** Every type an inbox of this scope shows (anything else is for the other inbox). */
export const scopeTypes = (scope: InboxScope): NotificationType[] => [...new Set(CATEGORIES[scope].flatMap((c) => c.types))];

/** Types whose repeats on the same thing on the same day collapse into one line ("Ana and 4 others liked…"). */
export const GROUPABLE = new Set<NotificationType>([
  "LIKE",
  "COMMENT",
  "FOLLOW",
  "PIN_COLLECTED",
  "ITEM_SOLD",
  "ROYALTY_EARNED",
  "BOUNTY_PARTICIPANT",
  "BOUNTY_SUBMISSION",
  "BOUNTY_COMMENT",
]);

/** Types about a post / a bounty (the entity id is that row's id, so its title can be looked up). */
export const POST_TYPES = new Set<NotificationType>(["POST", "LIKE", "COMMENT", "REPLY"]);
export const BOUNTY_TYPES = new Set<NotificationType>([
  "BOUNTY",
  "BOUNTY_PARTICIPANT",
  "BOUNTY_SUBMISSION",
  "BOUNTY_COMMENT",
  "BOUNTY_REPLY",
  "BOUNTY_WINNER",
  "BOUNTY_DOUBT",
  "BOUNTY_DOUBT_CREATE",
  "BOUNTY_DOUBT_REPLY",
]);
