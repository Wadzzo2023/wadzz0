"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

const TOPICS = ["Account & sign-in", "Payments & wallet", "Items & collection", "Bounties", "Brands & memberships", "Something else"] as const;
type Topic = (typeof TOPICS)[number];

/** Contact form: emails support with the sender as reply-to. Prefilled for signed-in users. */
export function SupportForm() {
  const { session } = useRequireAuth();
  const [name, setName] = useState(session?.user.name ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [topic, setTopic] = useState<Topic>("Something else");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const send = api.support.send.useMutation();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send.mutate({ name: name.trim(), email: email.trim(), topic, message: message.trim(), website: website || undefined });
  };

  if (send.isSuccess) {
    return (
      <div className="glass space-y-3 rounded-[1.4rem] p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <p className="display text-3xl">Message sent</p>
        <p className="text-sm text-muted-foreground">We&apos;ll reply to {email} as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-[1.4rem] p-5">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="h-11 rounded-xl" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
        </label>
      </div>
      <div className="space-y-1.5">
        <span className="text-sm font-semibold">What&apos;s it about?</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Topic">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={topic === t}
              onClick={() => setTopic(t)}
              className={cn("h-9 rounded-full px-3.5 text-sm font-medium ring-1 transition-colors", topic === t ? "bg-primary text-primary-foreground ring-primary" : "bg-foreground/[0.03] text-muted-foreground ring-foreground/[0.08] hover:text-foreground")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Message</span>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={5000} rows={6} placeholder="What happened, and what did you expect? Item or bounty links help." className="resize-none rounded-xl" />
      </label>
      {/* honeypot: hidden from people, tempting to bots */}
      <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" name="website" />
      {send.error && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{send.error.message}</p>}
      <div className="flex justify-end">
        <Button type="submit" className="px-6" disabled={send.isPending}>
          <Send className="size-4" /> {send.isPending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
