"use client"

import Image from "next/image"
import { Button } from "~/components/shadcn/ui/button"
import { Input } from "~/components/shadcn/ui/input"
import { Textarea } from "~/components/shadcn/ui/textarea"
import { Camera, Loader2, Save } from "lucide-react"
import { api } from "~/utils/api"
import { z } from "zod"
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { addrShort } from "~/utils/utils"
import CopyToClip from "~/components/wallete/copy_to_Clip"
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/shadcn/ui/form";
import { UploadS3Button } from "~/pages/test"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import { toast } from "~/components/shadcn/ui/use-toast"

export const AboutUserShema = z.object({
  bio: z
    .string()
    .max(100, { message: "Bio must be less than 101 characters" })
    .nullable(),
  name: z
    .string()
    .min(3, { message: "Name must be greater than 2 characters." })
    .max(100, { message: "Name must be less than 99 characters." }),
  profileUrl: z.string().nullable().optional(),
});

type UserSettingsType = {
  name: string | null;
  id: string;
  joinedAt: Date | null;
  bio: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  fromAppSignup: boolean | null;
}

export default function ModernSettingsPage() {
  const user = api.fan.user.getUser.useQuery();

  if (!user.data && !user.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" >
        <div>User data not found!</div>
      </div>
    )
  }
  if (user.isLoading) {
    return (
      <div className="min-h-[calc(100vh-10.8vh)] bg-background">
        <div className="mx-auto w-[85vw] space-y-8 py-8">
          <div className="grid gap-8 border-b border-border/60 pb-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Skeleton className="h-[260px] w-[260px] rounded-none" />
            <div className="space-y-4">
              <Skeleton className="h-9 w-56 rounded-none" />
              <Skeleton className="h-5 w-72 rounded-none" />
              <Skeleton className="h-5 w-64 rounded-none" />
              <Skeleton className="h-40 w-full rounded-none" />
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Skeleton className="hidden h-16 w-full rounded-none lg:block" />
            <div className="space-y-8">
              <Skeleton className="h-12 w-full rounded-none" />
              <Skeleton className="h-28 w-full rounded-none" />
              <Skeleton className="h-10 w-40 rounded-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (user.error) {
    return <div>Error: {user.error.message}</div>
  }

  if (user.data) {
    return <AboutUser user={user.data} />
  }
}

const AboutUser = ({ user }: { user: UserSettingsType }) => {
  const utils = api.useUtils();

  const mutation = api.fan.user.updateUserProfile.useMutation({
    onSuccess: async () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        variant: "default",
      });
      await utils.fan.user.getUser.invalidate();

    },
    onError: (error) => {
      toast({
        title: "Profile Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateProfileMutation =
    api.fan.user.changeUserProfilePicture.useMutation();

  const form = useForm({
    resolver: zodResolver(AboutUserShema),
    defaultValues: {
      name: user.name ?? "",
      bio: user.bio ?? "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof AboutUserShema>> = (data) =>
    mutation.mutate(data, {});

  return (
    <div className="min-h-[calc(100vh-10.8vh)] bg-background">
      <div className="mx-auto w-[85vw] py-8">
        <section className="grid gap-8 border-b border-border/60 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="relative h-[260px] w-[260px] overflow-hidden bg-muted">
              <Image
                src={user.image ?? "/images/logo.png"}
                alt="Profile picture"
                width={260}
                height={260}
                className="h-full w-full object-cover"
              />
            </div>
            <UploadS3Button
              id="settings-profile-upload"
              endpoint="imageUploader"
              variant="hidden"
              onClientUploadComplete={(res: { url: string }) => {
                const fileUrl = res.url;
                updateProfileMutation.mutate(fileUrl);
              }}
              onUploadError={(error: Error) => {
                toast({
                  title: "Upload Error",
                  description: error.message,
                  variant: "destructive",
                })
              }}
            />
            <Button
              type="button"
              className="h-9 rounded-none px-3 text-xs font-medium"
              onClick={() => document.getElementById("settings-profile-upload")?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Change Photo
            </Button>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">
              {user.name && user?.name?.length > 21 ? `${user.name.slice(0, 22)}...` : user.name?.slice(0, 22)}
            </h1>

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Public Key</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono">{addrShort(user.id, 7)}</span>
                  <CopyToClip text={user.id} collapse={7} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Joined</p>
                <p className="mt-1">
                  {new Date(user.joinedAt ? user.joinedAt : new Date()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio Preview</p>
              <div className="mt-2 min-h-[170px] bg-muted/40 p-4 text-sm leading-relaxed">
                {user.bio?.length ? user.bio : "You haven't set your bio yet."}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile Settings</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Update your public name and short bio shown across the app.
              </p>
            </div>

            <div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-10"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            disabled={mutation.isLoading}
                            className="h-11 rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="Name..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Name must be between 3 to 99 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Bio
                        </FormLabel>

                        <FormControl>
                          <Textarea
                            disabled={mutation.isLoading}
                            className="min-h-[120px] rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="Bio..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Bio must be less than 101 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center">
                    <Button
                      type="submit"
                      disabled={mutation.isLoading}
                      variant="default"
                      className="h-10 rounded-none px-5 text-sm font-medium"
                    >
                      {mutation.isLoading ? (
                        <Loader2
                          className="mr-2 h-4 w-4 animate-spin"
                          size={20}
                        />
                      ) : (
                        <Save className="mr-2 h-4 w-4" size={20} />
                      )}
                      {mutation.isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
