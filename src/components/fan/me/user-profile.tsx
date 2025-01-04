import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Avater from "../../ui/avater";
import { type Creator, type User } from "@prisma/client";
import { api } from "~/utils/api";
import { Card, CardHeader, CardContent } from "~/components/shadcn/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "~/components/shadcn/ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "~/components/shadcn/ui/dialog";
import { Button } from "~/components/shadcn/ui/button";
import { Label } from "~/components/shadcn/ui/label";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Separator } from "~/components/shadcn/ui/separator";
import { addrShort } from "~/utils/utils";
import { Loader2, Pen, PenTool, Save } from "lucide-react";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/shadcn/ui/form";
import toast from "react-hot-toast";
import { UploadS3Button } from "~/pages/test";
export default function About() {
  const user = api.fan.user.getUser.useQuery();

  if (user.data)
    return (
      <div className="flex  flex-col items-center ">
        {/* <h2 className="text-2xl font-bold">About</h2> */}
        <div className="my-5  w-96 rounded-box  bg-base-200">
          <AboutForm user={user.data} />
        </div>
      </div>
    );
  else return <p className="text-error">no user</p>;
}

export const UserAboutShema = z.object({
  bio: z
    .string()
    .max(100, { message: "Bio must be less than 101 characters" })
    .nullable(),
  name: z
    .string()
    .min(3, { message: "Name must be greater than 2 characters." })
    .max(20, { message: "Name must be less than 21 characters." }),
  profileUrl: z.string().nullable().optional(),
});

function AboutForm({ user }: { user: User }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mutation = api.fan.user.updateUserProfile.useMutation();

  const updateProfileMutation =
    api.fan.user.changeUserProfilePicture.useMutation();

  const form = useForm({
    resolver: zodResolver(UserAboutShema),
    defaultValues: {
      name: user.name ?? "Unknown",
      bio: user.bio ?? "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof UserAboutShema>> = (data) =>
    mutation.mutate(data, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        setIsDialogOpen(false);
      },
    });

  return (
    // <form
    //   onSubmit={handleSubmit(onSubmit)}
    //   className="flex flex-col gap-2  p-5"
    // >
    //   <div className="flex items-center  gap-2">
    //     <div className="">
    //       <Avater url={user.image} className="w-8" />
    //     </div>
    //    
    //   </div>
    //   <label className="form-control w-full ">
    //     <div className="label">
    //       <span className="label-text">Display Name</span>
    //     </div>
    //     <input
    //       type="text"
    //       placeholder="Enter Name ..."
    //       {...register("name")}
    //       className="input input-bordered w-full "
    //     />
    //     {errors.name && (
    //       <div className="label">
    //         <span className="label-text-alt text-warning">
    //           {errors.name.message}
    //         </span>
    //       </div>
    //     )}
    //   </label>
    //   <label className="form-control">
    //     <div className="label">
    //       <span className="label-text">Your bio</span>
    //     </div>
    //     <textarea
    //       {...register("bio")}
    //       className="textarea textarea-bordered h-28"
    //       placeholder="bio"
    //     ></textarea>
    //     {errors.bio && (
    //       <div className="label">
    //         <span className="label-text-alt text-warning">
    //           {errors.bio.message}
    //         </span>
    //       </div>
    //     )}
    //   </label>
    //   <button className="btn btn-primary" type="submit">
    //     {mutation.isLoading && (
    //       <span className="loading loading-spinner"></span>
    //     )}
    //     Save
    //   </button>
    // </form>
    <>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="flex items-center gap-4 bg-muted p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? "/images/icons/avatar-icon.png"} />
          </Avatar>
          <div className="grid flex-1 gap-1">
            <div className="text-lg font-semibold">
              {user.name ?? "Unknown"}
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                // variant=""
                onClick={() => setIsDialogOpen(true)}
              >
                <Pen size={14} className="mr-2" /> Edit profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-full overflow-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your profile information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase">
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              disabled={mutation.isLoading}
                              className="focus-visible:ring-0 focus-visible:ring-offset-0"
                              placeholder="Name..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs ">
                            Name must be between 3 to 20 characters
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
                          <FormLabel className="text-xs font-bold uppercase">
                            BIO
                          </FormLabel>

                          <FormControl>
                            <Textarea
                              disabled={mutation.isLoading}
                              className="min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <FormDescription className="text-xs">
                        Max Size 4MB and Dimension 200x200
                      </FormDescription>
                      <div className="flex items-center gap-4  ">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={user.image ?? "/images/icons/avatar-icon.png"}
                          />
                        </Avatar>

                        <UploadS3Button
                          endpoint="imageUploader"
                          onClientUploadComplete={(res) => {
                            const fileUrl = res.url;
                            updateProfileMutation.mutate(fileUrl);
                          }}
                          onUploadError={(error: Error) => {
                            // Do something with the error.
                            toast.error(`ERROR! ${error.message}`);
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-4 ">
                      <Button
                        type="submit"
                        disabled={mutation.isLoading}
                        variant="default"
                        className="w-full shrink-0 font-bold "
                      >
                        {mutation.isLoading ? (
                          <Loader2
                            className="mr-2 h-4 w-4 animate-spin"
                            size={20}
                          />
                        ) : (
                          <Save className="mr-2  font-bold" size={20} />
                        )}
                        {mutation.isLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-1">
            <div className="text-lg font-semibold">
              {user.name ?? "Unknown"}
            </div>
            <div className="text-sm text-muted-foreground">
              Public Key : {addrShort(user.id, 4)}
            </div>
            {/* <div className="text-sm text-muted-foreground">
              Verified Status :{" "}
              {user.emailVerified ? "Verified" : "Not Verified"}
            </div> */}
            <div className="text-sm text-muted-foreground">
              Joined at :{" "}
              {user.joinedAt
                ? new Date(user.joinedAt).toDateString()
                : "Unknown"}
            </div>
          </div>
          <Separator />
          <div className="text-lg font-semibold">BIO</div>
          <div className="text-sm text-muted-foreground">
            {user.bio === "" || user.bio === null
              ? `You haven't set your bio!`
              : user.bio}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
