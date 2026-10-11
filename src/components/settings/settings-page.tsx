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

function SettingsView() {
  const me = api.user.me.useQuery();
  return (
    <PageBody className="space-y-6">
      <h1 className="font-hud text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
      {me.isLoading || !me.data ? (
        <>
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </>
      ) : (
        <>
          <ProfileCard me={me.data} />
          <AppearanceCard />
          <AccountCard me={me.data} />
        </>
      )}
    </PageBody>
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

/** Cover + picture on top (each with its own change button), then name and bio. */
function ProfileCard({ me }: { me: Me }) {
  const utils = api.useUtils();
  const [name, setName] = useState(me.name ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [image, setImage] = useState(me.image ?? null);
  const [cover, setCover] = useState(me.coverImage ?? null);
  const avatarUp = useImageUpload();
  const coverUp = useImageUpload();
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const update = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Profile saved");
      void utils.user.me.invalidate();
    },
  });

  const dirty = name.trim() !== (me.name ?? "") || bio.trim() !== (me.bio ?? "") || image !== (me.image ?? null) || cover !== (me.coverImage ?? null);
  const busy = update.isPending || avatarUp.progress !== null || coverUp.progress !== null;

  const pick = async (file: File | undefined, which: "image" | "cover") => {
    if (!file) return;
    try {
      const url = await (which === "image" ? avatarUp : coverUp).upload(file);
      (which === "image" ? setImage : setCover)(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({ name: name.trim(), bio: bio.trim() || undefined, image: image ?? undefined, coverImage: cover ?? undefined });
  };

  return (
    <form onSubmit={save} className="glass overflow-hidden rounded-2xl">
      <div className="relative h-36 bg-black sm:h-44">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.5),transparent_60%),radial-gradient(circle_at_80%_70%,hsl(190_90%_50%/0.35),transparent_60%)]" />
        )}
        <button
          type="button"
          onClick={() => coverInput.current?.click()}
          disabled={busy}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-black/70"
        >
          <Camera className="size-3.5" /> {coverUp.progress !== null ? `${coverUp.progress}%` : cover ? "Change cover" : "Add cover"}
        </button>
        <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => void pick(e.target.files?.[0], "cover")} />
      </div>

      <div className="space-y-5 p-5 pt-0">
        <div className="-mt-12 flex items-end gap-4">
          <button type="button" onClick={() => avatarInput.current?.click()} disabled={busy} className="group relative shrink-0 rounded-full bg-gradient-to-tr from-primary via-green-hot to-cyan-400 p-[3px]" aria-label="Change profile picture">
            <Avatar src={image} name={name} className="size-24 border-4 border-background text-2xl" />
            <span className="absolute inset-[3px] flex items-center justify-center rounded-full bg-black/45 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {avatarUp.progress !== null ? `${avatarUp.progress}%` : <Camera className="size-5" />}
            </span>
          </button>
          <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => void pick(e.target.files?.[0], "image")} />
          <p className="pb-2 text-xs text-muted-foreground">JPG, PNG, WebP or GIF, up to 10 MB.</p>
        </div>

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
          <Button type="submit" className="rounded-xl px-6" disabled={!dirty || busy || name.trim().length < 2}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
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
