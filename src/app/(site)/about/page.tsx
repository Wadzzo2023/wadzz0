import { ArrowRight, Coins, Crown, Layers, Repeat2, ShieldCheck, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StaticHeader } from "~/components/static/static-header";
import { env } from "~/env";
import { PageBody } from "~/ui/page-header";

export const metadata: Metadata = {
  title: "About",
  description: "Wadzzo connects fans with the creators and brands they love — collect items, join memberships and win rewards, all on Stellar.",
  alternates: { canonical: "/about" },
};

const FOR_FANS = [
  { icon: Layers, title: "Collect", text: "Art, video, music and 3D items from creators — yours in your own wallet, with full content only owners can open." },
  { icon: Crown, title: "Join memberships", text: "Hold a brand's page token to unlock its tiers: members-only posts, items and perks." },
  { icon: Target, title: "Win bounties", text: "Complete tasks brands post and get paid straight to your wallet when you win." },
  { icon: Repeat2, title: "Resell", text: "List what you own for other fans. Creators earn a royalty on every resale." },
];

const STEPS = [
  { title: "Sign in", text: "With email or a social account — or bring your own Stellar wallet." },
  { title: "Find what you love", text: "Browse the market, follow creators and keep up in your feed." },
  { title: "See the full price, then confirm", text: "Every purchase shows exactly what it costs and whether it'll go through before you pay." },
];

export default function AboutPage() {
  const portal = env.NEXT_PUBLIC_BRAND_PORTAL_URL.replace(/\/$/, "");
  return (
    <PageBody wide className="space-y-10">
      <StaticHeader
        eyebrow="About Wadzzo"
        title={
          <>
            Where fans and brands <span className="text-gradient">meet</span>
          </>
        }
        description="Wadzzo connects you with the creators and brands you love. Collect their items, join their memberships and win rewards — everything you earn lives in your own wallet on Stellar."
      />

      <section className="space-y-4">
        <h2 className="display text-4xl">For fans</h2>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FOR_FANS.map((f) => (
            <div key={f.title} className="glass space-y-2 rounded-[1.4rem] p-5">
              <span className="flex size-10 items-center justify-center blob bg-primary text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="display text-2xl">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="display text-4xl">How it works</h2>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="glass flex gap-4 rounded-[1.4rem] p-5">
              <span className="display flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl">{i + 1}</span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-sm text-muted-foreground">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
        <div className="glass space-y-3 rounded-[1.4rem] p-6">
          <span className="flex size-10 items-center justify-center blob bg-primary text-primary-foreground">
            <Coins className="size-5" />
          </span>
          <h2 className="display text-4xl">For creators and brands</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Sell items that are minted the moment a fan buys them, set up membership tiers around your own page token, post to your fans and run bounties — all from the brand portal.</p>
          <a href={`${portal}/onboarding`} className="marker inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            Create your brand <ArrowRight className="size-4" />
          </a>
        </div>
        <div className="glass space-y-3 rounded-[1.4rem] p-6">
          <span className="flex size-10 items-center justify-center blob bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <h2 className="display text-4xl">Built on Stellar</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Items, tokens and payments are real Stellar assets and transactions. What you own is in your wallet, and every transaction can be checked on the public ledger.</p>
          <Link href="/faq" className="marker inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            Read the FAQ <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageBody>
  );
}
