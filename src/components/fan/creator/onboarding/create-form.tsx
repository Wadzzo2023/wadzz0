"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { Input } from "~/components/shadcn/ui/input";
import { Label } from "~/components/shadcn/ui/label";
import { Textarea } from "~/components/shadcn/ui/textarea";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { UploadS3Button } from "~/pages/test";
import { ipfsHashToUrl } from "~/utils/ipfs";
import Image from "next/image";
import { api } from "~/utils/api";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Creator } from "@prisma/client";
import { CreateBrand } from "./create-button";
import { env } from "~/env";

export const brandCreateRequestSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().max(500, "Bio must be 500 characters or less"),
  pageAssetName: z
    .string()
    .min(1, "Page asset name is required")
    .max(12, "Page asset name must be 12 characters or less")
    .regex(/^[^\s]+$/, "Page asset name cannot contain spaces"),
  vanityUrl: z
    .string()
    .min(2, "Vanity URL must be 2 characters or more")
    .max(30, "Vanity URL must be 30 characters or less")
    .regex(/^[^\s]+$/, "Vanity URL cannot contain spaces"),
  profileUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  assetThumbnail: z.string().url().optional(),
});

export type BrandFormData = z.infer<typeof brandCreateRequestSchema>;

interface BrandCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  creator?: CreateBrand;
  edit?: boolean;
}

// ── Small helper: section heading ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

// ── Field wrapper with consistent spacing ────────────────────────────────────
function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

export default function BrandCreationForm({
  isOpen,
  onClose,
  creator,
  edit,
}: BrandCreationFormProps) {
  const [uploading, setUploading] = useState(false);
  const [pageAssetThumbnail, setPageAssetThumbnail] = useState<
    string | undefined
  >(creator?.pageAsset?.thumbnail ?? undefined);
  const [file, setFile] = useState<File>();
  const [ipfs, setCid] = useState<string>();
  const [profileUrl, setProfileUrl] = useState(
    creator?.profileUrl ?? undefined,
  );
  const [coverUrl, setCoverUrl] = useState(creator?.coverUrl ?? undefined);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandCreateRequestSchema),
    defaultValues: {
      displayName: creator?.name ?? "",
      bio: creator?.bio ?? "",
      profileUrl: creator?.profileUrl ?? undefined,
      coverUrl: creator?.coverUrl ?? undefined,
      pageAssetName: creator?.pageAsset?.code ?? undefined,
      vanityUrl: creator?.vanityURL ?? undefined,
    },
  });

  const req = api.fan.creator.requestBrandCreate.useMutation({
    onSuccess: () => onClose(),
  });

  const onSubmit: SubmitHandler<z.infer<typeof brandCreateRequestSchema>> = (
    data,
  ) => {
    console.log("Form submitted:", data);
    data.assetThumbnail = pageAssetThumbnail;
    req.mutate({
      data,
      action: edit ? "update" : creator ? "page_asset" : "create",
    });
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload, fileToUpload.name);
      const res = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      const thumbnail = ipfsHashToUrl(ipfsHash);
      setPageAssetThumbnail(thumbnail);
      setCid(ipfsHash);
      setUploading(false);
    } catch (e) {
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const checkAvailability =
    api.fan.creator.checkVanityURLAvailability.useQuery(
      { vanityURL: watch("vanityUrl") },
      {
        onSuccess: (data) => {
          console.log("data", data);
          setIsAvailable(data.isAvailable);
        },
        onError: (error) => {
          console.error("error", error);
          setIsAvailable(false);
        },

      },
    );

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "vanityUrl" && value.vanityUrl) {
        checkAvailability.refetch();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, checkAvailability]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length > 0) {
        const file = files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            toast.error("File size should be less than 1MB");
            return;
          }
          setFile(file);
          await uploadFile(file);
        }
      }
    }
  };

  const baseUrl =
    env.NEXT_PUBLIC_ASSET_CODE.toLocaleLowerCase() === "wadzzo"
      ? "app.wadzzo.com"
      : "bandcoin.io";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:max-w-xl">
        {/* ── Header ── */}
        <div className="relative bg-primary px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-primary-foreground">
                {edit ? "Update" : "Create"} Your Brand
              </DialogTitle>
              <p className="text-xs text-primary-foreground/70">
                {edit
                  ? "Update your brand details below"
                  : "Fill in your brand details to get started"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[72vh] overflow-y-auto bg-background px-6 py-5"
        >
          {/* ── Identity section ── */}
          <SectionLabel>Identity</SectionLabel>
          <div className="mb-5 space-y-4 rounded-xl border border-border bg-muted/40 p-4">
            <Field>
              <Label
                htmlFor="displayName"
                className="text-sm font-medium text-foreground"
              >
                Display Name
              </Label>
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="displayName"
                    placeholder="Your brand name"
                    className="border-input bg-background focus-visible:ring-ring"
                  />
                )}
              />
              {errors.displayName && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="h-3 w-3" />
                  {errors.displayName.message}
                </p>
              )}
            </Field>

            <Field>
              <Label
                htmlFor="bio"
                className="text-sm font-medium text-foreground"
              >
                Bio
              </Label>
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="bio"
                    placeholder="Tell us about your brand…"
                    rows={3}
                    className="resize-none border-input bg-background focus-visible:ring-ring"
                  />
                )}
              />
              <div className="flex items-center justify-between">
                {errors.bio ? (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <XCircle className="h-3 w-3" />
                    {errors.bio.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">
                  {watch("bio")?.length ?? 0}/500
                </span>
              </div>
            </Field>
          </div>

          {/* ── Media section ── */}
          <SectionLabel>Media</SectionLabel>
          <div className="mb-5 space-y-4 rounded-xl border border-border bg-muted/40 p-4">
            {/* Profile photo */}
            <Field>
              <Label className="text-sm font-medium text-foreground">
                Profile Photo
              </Label>
              <div className="flex items-center gap-4">
                <UploadS3Button
                  endpoint="profileUploader"
                  onClientUploadComplete={(res) => {
                    const fileUrl = res.url;
                    setValue("profileUrl", fileUrl);
                    setProfileUrl(fileUrl);
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`ERROR! ${error.message}`);
                  }}
                  type="profile"
                />
                {profileUrl && (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/30 shadow-sm">
                    <Image
                      fill
                      alt="Profile preview"
                      src={profileUrl}
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </Field>

            {/* Cover photo */}
            <Field>
              <Label className="text-sm font-medium text-foreground">
                Cover Photo
              </Label>
              <div className="flex items-center gap-4">
                <UploadS3Button
                  endpoint="coverUploader"
                  onClientUploadComplete={(res) => {
                    const fileUrl = res.url;
                    setValue("coverUrl", fileUrl);
                    setCoverUrl(fileUrl);
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`ERROR! ${error.message}`);
                  }}
                  type="cover"
                />
                {coverUrl && (
                  <div className="relative h-12 w-20 overflow-hidden rounded-lg border-2 border-primary/30 shadow-sm">
                    <Image
                      fill
                      alt="Cover preview"
                      src={coverUrl}
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </Field>
          </div>

          {/* ── Asset section ── */}
          <SectionLabel>Stellar Asset</SectionLabel>
          <div className="mb-5 space-y-4 rounded-xl border border-border bg-muted/40 p-4">
            <Field>
              <Label
                htmlFor="pageAssetName"
                className="text-sm font-medium text-foreground"
              >
                Asset Name
                <span
                  className="ml-1.5 cursor-help rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground"
                  title="This is the name for your stellar asset."
                >
                  ?
                </span>
              </Label>
              <Controller
                name="pageAssetName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="pageAssetName"
                    placeholder="e.g. MYBRAND (max 12 chars)"
                    className="border-input bg-background font-mono tracking-wide focus-visible:ring-ring"
                  />
                )}
              />
              {errors.pageAssetName && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="h-3 w-3" />
                  {errors.pageAssetName.message}
                </p>
              )}
            </Field>

            <Field>
              <Label
                htmlFor="assetPic"
                className="text-sm font-medium text-foreground"
              >
                Asset Thumbnail
                <span
                  className="ml-1.5 cursor-help rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground"
                  title="Upload a picture for your stellar asset."
                >
                  ?
                </span>
              </Label>

              <label
                htmlFor="file"
                className="group flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-3 transition hover:border-primary/60 hover:bg-primary/5"
              >
                <ImagePlus className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                  {file ? file.name : "Choose a .jpg or .png file"}
                </span>
                <input
                  type="file"
                  id="file"
                  accept=".jpg, .png"
                  onChange={handleChange}
                  className="sr-only"
                />
              </label>

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading…
                </div>
              )}

              {pageAssetThumbnail && !uploading && (
                <div className="relative mt-1 h-14 w-14 overflow-hidden rounded-lg border border-primary/30 shadow-sm">
                  <Image
                    fill
                    alt="Asset thumbnail preview"
                    src={pageAssetThumbnail}
                    className="object-cover"
                  />
                </div>
              )}
            </Field>
          </div>

          {/* ── Vanity URL section ── */}
          {!edit && (
            <>
              <SectionLabel>Custom URL</SectionLabel>
              <div className="mb-6 space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                <Field>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="vanityUrl"
                      className="text-sm font-medium text-foreground"
                    >
                      Vanity URL
                    </Label>
                    <span
                      className="cursor-help text-xs text-muted-foreground underline decoration-dotted"
                      title="We are providing one month free trial for custom URL. After that, you will be charged 10 BAND per month."
                    >
                      1 month free trial
                    </span>
                  </div>

                  <Controller
                    name="vanityUrl"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                        <span className="select-none whitespace-nowrap border-r border-input bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                          {baseUrl}/
                        </span>
                        <input
                          {...field}
                          id="vanityUrl"
                          onInput={(e) =>
                          (e.currentTarget.value =
                            e.currentTarget.value.toLowerCase())
                          }
                          placeholder="your-brand"
                          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                        {isAvailable !== null && (
                          <span className="pr-3">
                            {isAvailable ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  />

                  {errors.vanityUrl && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <XCircle className="h-3 w-3" />
                      {errors.vanityUrl.message}
                    </p>
                  )}

                  {isAvailable !== null && !errors.vanityUrl && (
                    <p
                      className={`flex items-center gap-1 text-xs font-medium ${isAvailable ? "text-success" : "text-destructive"
                        }`}
                    >
                      {isAvailable ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> URL is available
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> URL is taken
                        </>
                      )}
                    </p>
                  )}
                </Field>
              </div>
            </>
          )}

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={req.isLoading}
            className="w-full gap-2 bg-primary py-5 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-60"
          >
            {req.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Sparkles className="h-4 w-4" />
            {edit ? "Save Changes" : "Create Brand"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}