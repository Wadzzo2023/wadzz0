import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StaticHeader } from "~/components/static/static-header";
import { PageBody } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "FAQ",
  description: "How Wadzzo works: collecting items, paying, memberships, bounties, resale and your wallet.",
  alternates: { canonical: "/faq" },
};

const FAQ: { topic: string; items: { q: string; a: string }[] }[] = [
  {
    topic: "Getting started",
    items: [
      { q: "What is Wadzzo?", a: "Wadzzo is where you collect digital items from your favourite creators and brands, join their memberships, and win rewards by completing bounties. Everything you own lives in your own wallet on the Stellar network." },
      { q: "How do I sign in?", a: "Sign in with email, Google, Facebook or Apple and Wadzzo manages a wallet for you — nothing to install. If you already use a Stellar wallet (like Freighter, xBull or Albedo), you can sign in with it instead and approve each transaction yourself." },
      { q: "Is it on a blockchain?", a: "Yes — Stellar. Every purchase, sale and transfer is a real Stellar transaction, and each one in your Activity has a link to view it on Stellar Expert." },
    ],
  },
  {
    topic: "Collecting and paying",
    items: [
      { q: "What can I collect?", a: "Images, videos, music and 3D items. Each one is a token in your wallet, and only owners can open its full content." },
      { q: "How can I pay?", a: "With Wadzzo tokens, with XLM, or by card where it's offered. Before you confirm, you see the full price breakdown and whether the purchase will go through." },
      { q: "Why is there a small reserve?", a: "Stellar asks every wallet to keep a small amount of XLM (0.5 XLM) for each new kind of token it holds. It isn't a fee — it stays in your wallet." },
      { q: "What does \"minted when you buy\" mean?", a: "Many items are created the moment someone buys or claims them, so you only pay for the copy you get. Limited editions show how many are left." },
      { q: "How do I get Wadzzo tokens?", a: "Accounts that sign in with email or social login can buy token packs by card from the Wallet. Wallet users can receive Wadzzo tokens from anyone, or earn them by winning bounties." },
    ],
  },
  {
    topic: "Your collection and wallet",
    items: [
      { q: "Can I resell an item?", a: "Yes. From your Collection, choose Resell and set a price. The creator earns a royalty on every resale, and you can change the price or take it back any time." },
      { q: "How do I send tokens to someone?", a: "Open your Wallet, pick the token and choose Send. If the other person can't hold that token yet, it arrives as a gift they accept from their wallet." },
      { q: "Where's my transaction history?", a: "In Activity (from the menu, or Recent activity on your Wallet). Each entry opens a receipt with exactly what it cost." },
    ],
  },
  {
    topic: "Brands, memberships and bounties",
    items: [
      { q: "What are memberships and page tokens?", a: "Each brand has its own page token. Holding enough of it puts you in one of the brand's membership tiers, which unlocks members-only posts and items." },
      { q: "What are bounties?", a: "Brands post tasks — take a photo, make a video, write a story. Join a bounty, submit your entry, and if you win, the reward is sent straight to your wallet." },
      { q: "I'm a creator. How do I start?", a: "Create your brand in the Wadzzo brand portal. From there you can post, create and sell items, set up membership tiers and run bounties." },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((t) => t.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <PageBody className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <StaticHeader eyebrow="Help" title={<>Frequently asked <span className="text-gradient">questions</span></>} description="Everything about collecting, paying, memberships and bounties on Wadzzo." />
      {FAQ.map((t) => (
        <section key={t.topic} className="space-y-3">
          <h2 className="font-hud text-lg font-bold">{t.topic}</h2>
          <div className="glass divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl">
            {t.items.map((i) => (
              <details key={i.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold transition-colors hover:bg-foreground/[0.03] [&::-webkit-details-marker]:hidden">
                  {i.q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{i.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <section className="glass flex flex-col items-start gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-hud font-bold">Still stuck?</h2>
          <p className="text-sm text-muted-foreground">Send us a message and we&apos;ll get back to you.</p>
        </div>
        <Link href="/support" className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]">
          Contact support
        </Link>
      </section>
    </PageBody>
  );
}
