"use client";

import { Camera, Check, Copy, LogOut, Monitor, Moon, Settings, Sun, type LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

import { SignedIn } from "~/components/shell/sign-in-prompt";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { useRequireAuth } from "~/hooks/use-require-auth";
import { isCustodial } from "~/lib/custodial";
import { describeFile, putFile } from "~/lib/upload";
import { cn } from "~/lib/utils";
import { PageBody } from "~/ui/page-header";
import { Avatar } from "~/ui/person";
import { Skeleton } from "~/ui/skeleton";
import { api, type RouterOutputs } from "~/utils/api";

type Me = NonNullable<RouterOutputs["user"]["me"]>;

const BIO_MAX = 200;
const THEMES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function SettingsPage() {
  return (
    <SignedIn icon={Settings} title="Settings" description="Sign in to edit your profile.">
      <SettingsView />
    </SignedIn>
  );
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "account", label: "Account" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Laid out like a profile page: cover and picture up top, then tabs for editing. */
function SettingsView() {
  const me = api.user.me.useQuery();
  const [tab, setTab] = useState<Tab>("profile");
  if (me.isLoading || !me.data) {
    return (
      <div>
        <Skeleton className="h-[34svh] min-h-[220px] max-h-[380px] rounded-none" />
        <PageBody wide className="space-y-4">
          <Skeleton className="h-24 w-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </PageBody>
      </div>
    );
  }
  return (
    <div>
      <h1 className="sr-only">Settings</h1>
      <ProfileHeader me={me.data} />
      <PageBody wide className="space-y-6 pt-6">
        <div className="glass flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-9 shrink-0 items-center rounded-lg px-4 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-primary text-primary-foreground shadow-[0_0_20px_-6px_hsl(var(--primary)/0.8)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="max-w-2xl" role="tabpanel">
          {tab === "profile" && <ProfileForm me={me.data} />}
          {tab === "appearance" && <AppearanceCard />}
          {tab === "account" && <AccountCard me={me.data} />}
        </div>
      </PageBody>
    </div>
  );
}

/** Upload one image (profile picture or cover) straight to storage; returns its URL. */
function useImageUpload() {
  const sign = api.user.imageUploadUrl.useMutation();
  const [progress, setProgress] = useState<number | null>(null);
  const upload = async (file: File) => {
    setProgress(0);
    try {
      const { uploadUrl, fileUrl } = await sign.mutateAsync(await describeFile(file));
      await putFile(uploadUrl, file, setProgress);
      return fileUrl;
    } finally {
      setProgress(null);
    }
  };
  return { upload, progress };
}

/**
 * The same header as a creator page: full-width cover with the picture
 * overlapping it, name, bio and join date beside it. Cover and picture each
 * have their own change button and save as soon as the upload finishes.
 */
function ProfileHeader({ me }: { me: Me }) {
  const utils = api.useUtils();
  const avatarUp = useImageUpload();
  const coverUp = useImageUpload();
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const update = api.user.update.useMutation({ onSuccess: () => void utils.user.me.invalidate() });
  const busy = update.isPending || avatarUp.progress !== null || coverUp.progress !== null;

  const pick = async (file: File | undefined, which: "image" | "coverImage") => {
    if (!file) return;
    try {
      const url = await (which === "image" ? avatarUp : coverUp).upload(file);
      await update.mutateAsync({ name: me.name ?? "Fan", bio: me.bio ?? undefined, image: me.image ?? undefined, coverImage: me.coverImage ?? undefined, [which]: url });
      toast.success(which === "image" ? "Profile picture updated" : "Cover updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };
  const accept = "image/jpeg,image/png,image/webp,image/gif";

  return (
    <>
      <div className="relative h-[34svh] min-h-[220px] max-h-[380px] overflow-hidden bg-black">
        {me.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.coverImage} alt="" className="size-full object-cover" />
        ) : me.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.image} alt="" className="size-full scale-125 object-cover opacity-60 blur-3xl" />
        ) : (
          <div className="size-full bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.45),transparent_55%),radial-gradient(circle_at_80%_70%,hsl(190_90%_50%/0.3),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-7xl justify-end px-4 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-black/70"
          >
            <Camera className="size-3.5" /> {coverUp.progress !== null ? `Uploading ${coverUp.progress}%` : me.coverImage ? "Change cover" : "Add cover"}
          </button>
        </div>
        <input ref={coverInput} type="file" accept={accept} hidden onChange={(e) => void pick(e.target.files?.[0], "coverImage")} />
      </div>

      <PageBody wide className="pb-0 pt-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            disabled={busy}
            aria-label="Change profile picture"
            className="group relative -mt-14 w-fit shrink-0 rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[3px] shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)] sm:-mt-20"
          >
            <Avatar src={me.image} name={me.name} className="size-24 border-4 border-background text-3xl sm:size-36" />
            <span className="absolute inset-[3px] flex items-center justify-center rounded-full bg-black/45 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {avatarUp.progress !== null ? `${avatarUp.progress}%` : <Camera className="size-6" />}
            </span>
            <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background sm:bottom-2 sm:right-2">
              <Camera className="size-4" />
            </span>
          </button>
          <input ref={avatarInput} type="file" accept={accept} hidden onChange={(e) => void pick(e.target.files?.[0], "image")} />
          <div className="min-w-0 space-y-1 pb-1">
            <p className="truncate font-hud text-3xl font-bold tracking-tight sm:text-4xl">{me.name ?? "Your profile"}</p>
            {me.bio ? <p className="max-w-2xl whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{me.bio}</p> : <p className="text-sm text-muted-foreground">Add a bio so people know who you are.</p>}
            {me.joinedAt && <p className="text-xs text-muted-foreground">Joined {new Date(me.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>}
          </div>
        </header>
      </PageBody>
    </>
  );
}

/** Name and bio (picture and cover are changed in the header). */
function ProfileForm({ me }: { me: Me }) {
  const utils = api.useUtils();
  const [name, setName] = useState(me.name ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const update = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Profile saved");
      void utils.user.me.invalidate();
    },
  });
  const dirty = name.trim() !== (me.name ?? "") || bio.trim() !== (me.bio ?? "");

  const save = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({ name: name.trim(), bio: bio.trim() || undefined, image: me.image ?? undefined, coverImage: me.coverImage ?? undefined });
  };

  return (
    <form onSubmit={save} className="glass space-y-5 rounded-2xl p-5">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Display name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required className="h-11 rounded-xl" />
      </label>
      <label className="block space-y-1.5">
        <span className="flex justify-between text-sm font-semibold">
          Bio <span className="font-normal tabular-nums text-muted-foreground">{bio.length}/{BIO_MAX}</span>
        </span>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} rows={3} placeholder="A line about you" className="resize-none rounded-xl" />
      </label>
      {update.error && <p className="rounded-lg tone-danger px-3 py-2 text-sm">{update.error.message}</p>}
      <div className="flex justify-end">
        <Button type="submit" className="rounded-xl px-6" disabled={!dirty || update.isPending || name.trim().length < 2}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  return (
    <section className="glass space-y-3 rounded-2xl p-5">
      <h2 className="font-hud font-bold">Appearance</h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={theme === t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 text-sm font-semibold ring-1 transition-all",
              theme === t.id ? "bg-primary/10 text-primary ring-2 ring-primary" : "bg-foreground/[0.03] text-muted-foreground ring-foreground/[0.08] hover:text-foreground",
            )}
          >
            <t.icon className="size-5" /> {t.label}
          </button>
        ))}
      </div>
    </section>
  );
}

const SIGN_IN_LABEL: Record<string, string> = {
  emailPass: "Email",
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
  albedo: "Albedo",
  frieghter: "Freighter",
  xBull: "xBull",
  rabet: "Rabet",
  walletConnect: "WalletConnect",
  hana: "Hana",
  hotWallet: "Hot Wallet",
};

/** How I sign in and my Stellar address. */
function AccountCard({ me }: { me: Me }) {
  const { session } = useRequireAuth();
  const walletType = session?.user.walletType;
  const [copied, setCopied] = useState(false);
  const copy = () =>
    void navigator.clipboard.writeText(me.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });

  return (
    <section className="glass space-y-4 rounded-2xl p-5">
      <h2 className="font-hud font-bold">Account</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Signed in with</dt>
          <dd className="font-semibold">
            {(walletType && SIGN_IN_LABEL[walletType]) ?? "Wallet"}
            <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{isCustodial(walletType) ? "Managed by Wadzzo" : "Your own wallet"}</span>
          </dd>
        </div>
        {me.email && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-semibold">{me.email}</dd>
          </div>
        )}
        <div className="space-y-1.5">
          <dt className="text-muted-foreground">Stellar address</dt>
          <dd className="flex items-center gap-2">
            <span className="min-w-0 flex-1 break-all rounded-xl bg-foreground/[0.04] px-3 py-2 font-mono text-xs ring-1 ring-foreground/[0.06]">{me.id}</span>
            <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-xl" onClick={copy} aria-label="Copy address">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </dd>
        </div>
        {me.joinedAt && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="font-semibold">{new Date(me.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</dd>
          </div>
        )}
      </dl>
      <Button type="button" variant="outline" className="w-full rounded-xl text-destructive hover:text-destructive" onClick={() => void signOut({ callbackUrl: "/" })}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </section>
  );
}
