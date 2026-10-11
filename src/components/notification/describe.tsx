import { Award, Ban, CheckCircle2, Flag, Gift, MessageCircle, MessagesSquare, Newspaper, Reply, ShoppingBag, Tag, Target, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { InboxItem } from "~/server/notification-inbox";

type Meta = { bounty?: string; status?: string; item?: string; assetId?: number; qty?: number; amount?: number; currency?: string };

export type Described = { icon: LucideIcon; tone: string; text: ReactNode; href?: string };

const money = (m: Meta) => (m.amount ? `${m.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${m.currency ?? ""}`.trim() : null);
const b = (s: ReactNode) => <b className="font-semibold">{s}</b>;

export function whoText(i: InboxItem) {
  const first = i.actors[0]?.name ?? "Someone";
  if (i.count <= 1) return first;
  const rest = i.count - 1;
  return `${first} and ${rest} other${rest === 1 ? "" : "s"}`;
}

/** What a fan-inbox notification says, its icon, and where it goes in the fan app. */
export function describeFan(i: InboxItem): Described {
  const m = (i.meta ?? {}) as Meta;
  const who = b(whoText(i));
  const itemHref = m.assetId ? `/item/${m.assetId}` : "/activity";
  switch (i.type) {
    case "POST":
      return { icon: Newspaper, tone: "tone-info", text: <>{who} published a new post</>, href: `/posts/${i.entityId}` };
    case "COMMENT":
      return { icon: MessageCircle, tone: "tone-neutral", text: <>{who} commented on a post you follow</>, href: `/posts/${i.entityId}#comments` };
    case "REPLY":
      return { icon: Reply, tone: "tone-neutral", text: <>{who} replied in a conversation you&apos;re in</>, href: `/posts/${i.entityId}#comments` };
    case "BOUNTY":
      return { icon: Target, tone: "tone-success", text: <>{who} posted a new bounty</>, href: `/bounties/${i.entityId}` };
    case "BOUNTY_WINNER":
      return { icon: Award, tone: "tone-warning", text: <>{b("You won!")} The reward was sent to your wallet</>, href: `/bounties/${i.entityId}` };
    case "BOUNTY_COMMENT":
      return { icon: MessageCircle, tone: "tone-neutral", text: <>{who} joined the discussion on a bounty</>, href: `/bounties/${i.entityId}?section=discussion` };
    case "BOUNTY_REPLY":
      return { icon: Reply, tone: "tone-neutral", text: <>{who} replied to you in a bounty discussion</>, href: `/bounties/${i.entityId}?section=discussion` };
    case "BOUNTY_DOUBT_CREATE":
      return { icon: MessagesSquare, tone: "tone-info", text: <>{who} sent you a message about a bounty</>, href: `/bounties/${i.entityId}?section=chat` };
    case "BOUNTY_DOUBT_REPLY":
      return { icon: MessagesSquare, tone: "tone-info", text: <>{who} replied to your question</>, href: `/bounties/${i.entityId}?section=chat` };
    case "BOUNTY_ENTRY_REVIEWED": {
      const name = i.title ?? m.bounty;
      const what = m.status === "APPROVED" ? "was approved" : m.status === "REJECTED" ? "wasn't accepted" : "is being reviewed";
      return {
        icon: m.status === "REJECTED" ? Ban : CheckCircle2,
        tone: m.status === "REJECTED" ? "tone-danger" : m.status === "APPROVED" ? "tone-success" : "tone-info",
        text: <>Your entry{name ? <> to {b(name)}</> : null} {what}</>,
        href: `/bounties/${i.entityId}?section=entries`,
      };
    }
    case "BOUNTY_ENDED":
      return { icon: Flag, tone: "tone-neutral", text: <>{b(i.title ?? m.bounty ?? "A bounty")} has ended — all winners were chosen</>, href: `/bounties/${i.entityId}` };
    case "BOUNTY_CANCELLED":
      return { icon: Ban, tone: "tone-danger", text: <>{b(m.bounty ?? "A bounty")} was cancelled by the brand</> };
    case "ITEM_PURCHASED":
      return { icon: ShoppingBag, tone: "tone-success", text: <>You bought {m.qty && m.qty > 1 ? `${m.qty}× ` : ""}{b(m.item ?? "an item")}{money(m) ? ` for ${money(m)}` : ""}</>, href: itemHref };
    case "RESALE_SOLD":
      return { icon: Tag, tone: "tone-success", text: <>{who} bought your {b(m.item ?? "item")}{money(m) ? ` for ${money(m)}` : ""}</>, href: "/activity" };
    case "GIFT_RECEIVED":
      return { icon: Gift, tone: "tone-info", text: <>{who} sent you {m.item && m.assetId ? b(m.item) : money(m) ? b(money(m)) : "a gift"}</>, href: "/wallet" };
    default:
      return { icon: Target, tone: "tone-neutral", text: <>New activity</> };
  }
}
