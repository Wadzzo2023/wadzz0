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

import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { UploadS3Button } from "~/pages/test";
import { ipfsHashToUrl } from "~/utils/ipfs";
import Image from "next/image";
import { api } from "~/utils/api";
import { Loader2 } from "lucide-react";
import { Creator } from "@prisma/client";
import { set } from "date-fns";

export const brandCreateRequestSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().max(500, "Bio must be 500 characters or less"),
  pageAssetName: z
    .string()
    .min(1, "Page asset name is required")
    .max(12, "Page asset name must be 12 characters or less")
    .regex(/^[^\s]+$/, "Page asset name cannot contain spaces"),
  vanityUrl: z.string().min(1, "Vanity URL is required"),
  profileUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  assetThumbnail: z.string().url().optional(),
});

export type BrandFormData = z.infer<typeof brandCreateRequestSchema>;

interface BrandCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  creator?: Creator;
}

export default function BrandCreationForm({
  isOpen,
  onClose,
  creator,
}: BrandCreationFormProps) {
  const [uploading, setUploading] = useState(false);
  const [pageAssetThumbnail, setPageAssetThumbnail] = useState<string>();
  const [file, setFile] = useState<File>();
  const [ipfs, setCid] = useState<string>();

  const [profileUrl, setProfileUrl] = useState<string>();
  const [coverUrl, setCoverUrl] = useState<string>();

  const {
    control,
    handleSubmit,
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
      pageAssetName: "",
      vanityUrl: "",
    },
  });

  const req = api.fan.creator.requestBrandCreate.useMutation();

  const onSubmit: SubmitHandler<z.infer<typeof brandCreateRequestSchema>> = (
    data,
  ) => {
    console.log("Form submitted:", data);

    // data.assetThumbnail = pageAssetThumbnail;

    req.mutate({ data, alreadyCreator: creator ? true : false });

    // Here you would typically send the data to your backend
    // onClose();
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload, fileToUpload.name);
      // console.log("formData", fileToUpload);
      const res = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });
      const ipfsHash = await res.text();
      const thumbnail = ipfsHashToUrl(ipfsHash);
      setPageAssetThumbnail(thumbnail);
      // setValue("thumbnail", thumbnail);
      setCid(ipfsHash);

      setUploading(false);
    } catch (e) {
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Your Brand</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Controller
              name="displayName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="displayName"
                  placeholder="Your brand name"
                />
              )}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.displayName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="bio"
                  placeholder="Tell us about your brand"
                />
              )}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="profilePhoto">Profile Photo</Label>
            <UploadS3Button
              endpoint="profileUploader"
              onClientUploadComplete={(res) => {
                const fileUrl = res.url;
                setValue("profileUrl", fileUrl);
                setProfileUrl(fileUrl);
                // updateProfileMutation.mutate(fileUrl);
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                toast.error(`ERROR! ${error.message}`);
              }}
              type="profile"
            />

            {profileUrl && (
              <>
                <Image
                  className="p-2"
                  width={120}
                  height={120}
                  alt="preview image"
                  src={profileUrl}
                />
              </>
            )}
            {/* <Input id="profilePhoto" type="file" accept="image/*" /> */}
          </div>

          <div>
            <Label htmlFor="coverPhoto">Cover Photo</Label>
            <UploadS3Button
              endpoint="coverUploader"
              onClientUploadComplete={(res) => {
                const fileUrl = res.url;
                setValue("coverUrl", fileUrl);
                setCoverUrl(fileUrl);
                // coverChangeMutation.mutate(fileUrl);
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                toast.error(`ERROR! ${error.message}`);
              }}
              type="cover"
            />
            {coverUrl && (
              <>
                <Image
                  className="p-2"
                  width={120}
                  height={120}
                  alt="preview image"
                  src={coverUrl}
                />
              </>
            )}
            {/* <Input id="profilePhoto" type="file" accept="image/*" /> */}
          </div>

          <div>
            <Label htmlFor="pageAssetName">Page Asset Name</Label>
            <Controller
              name="pageAssetName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="pageAssetName"
                  placeholder="Name for your page asset"
                />
              )}
            />
            {errors.pageAssetName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.pageAssetName.message}
              </p>
            )}
          </div>
          {/* <div>
            <Label htmlFor="assetPic">Asset Picture</Label>
            <Input id="assetPic" type="file" accept="image/*" />
          </div> */}

          <div>
            <Label htmlFor="assetPic">Asset Picture</Label>
            <label className="form-control w-full px-2">
              <input
                type="file"
                id="file"
                accept=".jpg, .png"
                onChange={handleChange}
              />
              {uploading && (
                <progress className="progress mt-2 w-full px-2"></progress>
              )}
              {pageAssetThumbnail && (
                <>
                  <Image
                    className="p-2"
                    width={120}
                    height={120}
                    alt="preview image"
                    src={pageAssetThumbnail}
                  />
                </>
              )}
            </label>
          </div>
          <div>
            <Label htmlFor="vanityUrl">Vanity URL</Label>
            <Controller
              name="vanityUrl"
              control={control}
              render={({ field }) => (
                <Input {...field} id="vanityUrl" placeholder="your-brand" />
              )}
            />
            {errors.vanityUrl && (
              <p className="mt-1 text-sm text-red-500">
                {errors.vanityUrl.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            {req.isLoading && <Loader2 className="animate mr-2 animate-spin" />}
            Create Brand
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
