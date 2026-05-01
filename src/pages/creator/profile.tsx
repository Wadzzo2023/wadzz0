"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Grid3X3,
  Calendar,
  CheckCircle2,
  Edit,
  Camera,
  X,
  ArrowDownFromLine,
  Loader2,
} from "lucide-react";

import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Label } from "~/components/shadcn/ui/label";
import { UploadS3Button } from "~/pages/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Separator } from "~/components/shadcn/ui/separator";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import Avater from "~/components/ui/avater";
import toast from "react-hot-toast";
import MemberShipCard from "~/components/fan/creator/card";
import AddTierModal from "~/components/fan/creator/add-tier-modal";
import { Editor } from "~/components/editor";
import { PostCard } from "~/components/fan/creator/post";
import { SubscriptionType } from "~/pages/fans/creator/[id]";

function LoadingSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="h-[200px] w-full animate-pulse bg-muted" />
      <div className="flex flex-1 overflow-hidden">
        <div className="h-full w-[300px] shrink-0 border-r bg-card p-6">
          <div className="flex flex-col items-center pt-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="mt-4 h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Separator className="my-6" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorProfile() {
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: creator,
    isLoading,
    refetch,
  } = api.fan.creator.getMeCreator.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const allCreatedPost = api.fan.post.getPosts.useInfiniteQuery(
    {
      pubkey: creator?.id ?? "",
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!creator?.id,
    },
  );

  const updateProfileMutation =
    api.fan.creator.updateCreatorProfile.useMutation({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        refetch();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      },
      onError: (error) => {
        toast.error(`Error updating profile: ${error.message}`);
      },
    });

  const updateProfilePictureMutation =
    api.fan.creator.changeCreatorProfilePicture.useMutation({
      onSuccess: () => {
        toast.success("Profile Picture changed successfully");
        refetch();
      },
    });

  const coverChangeMutation =
    api.fan.creator.changeCreatorCoverPicture.useMutation({
      onSuccess: () => {
        toast.success("Cover Changed Successfully");
        refetch();
      },
    });

  const { data: subscriptions, isLoading: subscriptionsLoading } =
    api.fan.member.getAllMembership.useQuery({});
  const { data: pageAsset, isLoading: pageAssetLoading } =
    api.fan.creator.getCreatorPageAsset.useQuery();

  console.log("Subscriptions:", subscriptions);
  console.log("PageAsset:", pageAsset);

  const [editedProfile, setEditedProfile] = useState({
    name: creator?.name ?? "",
    bio: creator?.bio ?? "",
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    bio: "",
  });

  useEffect(() => {
    if (creator) {
      setEditedProfile({
        name: creator.name ?? "",
        bio: creator.bio ?? "",
      });
    }
  }, [creator]);

  const cancelProfileEditing = () => {
    setEditedProfile({
      name: creator?.name ?? "",
      bio: creator?.bio ?? "",
    });
    setFormErrors({
      name: "",
      bio: "",
    });
    setIsEditingProfile(false);
  };

  const saveProfileChanges = () => {
    setIsEditingProfile(false);
    updateProfileMutation.mutate({
      name: editedProfile.name,
      description: editedProfile.bio,
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollPosition = contentRef.current.scrollTop;
        const scrollThreshold = 100;

        if (scrollPosition > scrollThreshold) {
          setIsScrolled(true);
          setScrollProgress(
            Math.min(1, (scrollPosition - scrollThreshold) / 50),
          );
        } else {
          setIsScrolled(false);
          setScrollProgress(0);
        }
      }
    };

    const currentContentRef = contentRef.current;
    if (currentContentRef) {
      currentContentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentContentRef) {
        currentContentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!creator) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">No Creator Found</h2>
          <p className="text-muted-foreground">
            You haven&apos;t created a creator profile yet
          </p>
          <Link href="/fans/creator">
            <Button>Create Creator Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (creator.approved === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Approval Pending</h2>
          <p className="text-muted-foreground">
            Your creator profile is awaiting approval
          </p>
          <Link href="/fans/creator">
            <Button>View Status</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (creator.approved === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            Your creator profile has been banned. Contact admin for help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {showSuccessMessage && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-white shadow-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div
        className="relative w-full"
        style={{
          height: "200px",
        }}
      >
        <div className="relative h-full w-full">
          {coverChangeMutation.isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
          )}

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2 z-20 text-white hover:bg-background/20 md:hidden"
            onClick={toggleSidebar}
          >
            <ArrowDownFromLine className="h-5 w-5" />
          </Button>

          {!isEditingProfile ? (
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-4 top-4 gap-1"
              onClick={() => setIsEditingProfile(true)}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-4 top-4 gap-1"
              onClick={() => setIsEditingProfile(true)}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Button>
          )}

          <header
            className={cn(
              "absolute left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-primary/20 bg-background/95 px-4 shadow-md backdrop-blur-sm transition-all duration-500",
              isScrolled
                ? "translate-y-0 opacity-100"
                : "-translate-y-full opacity-0",
            )}
            style={{
              transform: isScrolled ? `translateY(0)` : `translateY(-100%)`,
              opacity: scrollProgress,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-background">
                <Avater url={creator.profileUrl} className="h-full w-full" />
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {creator.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isEditingProfile ? "Editing Profile" : "Creator Dashboard"}
                </span>
              </div>
            </div>
            {isEditingProfile ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={cancelProfileEditing}
                >
                  <X className="h-3 w-3" />
                  <span>Cancel</span>
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={saveProfileChanges}
                  disabled={
                    updateProfileMutation.isLoading ||
                    !!formErrors.name ||
                    !!formErrors.bio
                  }
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    {updateProfileMutation.isLoading ? "Saving..." : "Save"}
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit className="h-3 w-3" />
                <span>Edit Profile</span>
              </Button>
            )}
          </header>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "absolute z-40 h-full w-[300px] shrink-0 border-r bg-card transition-transform duration-500 md:relative",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 md:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex h-full flex-col overflow-auto p-6 pb-32">
            <div className="flex flex-col items-center pt-4">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-xl">
                  <Avater url={creator.profileUrl} className="h-full w-full" />
                </div>

                {isEditingProfile && (
                  <>
                    <UploadS3Button
                      id="creator-profile-upload"
                      endpoint="profileUploader"
                      variant="hidden"
                      onClientUploadComplete={(res) => {
                        const fileUrl = res.url;
                        updateProfilePictureMutation.mutate(fileUrl);
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`ERROR! ${error.message}`);
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      disabled={updateProfilePictureMutation.isLoading}
                      onClick={() =>
                        document
                          .getElementById("creator-profile-upload")
                          ?.click()
                      }
                    >
                      {updateProfilePictureMutation.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="mt-4 w-full text-center">
                {isEditingProfile ? (
                  <Input
                    value={editedProfile.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditedProfile({ ...editedProfile, name: value });
                      setFormErrors({
                        ...formErrors,
                        name:
                          value.length > 98
                            ? "Name must be less than 99 characters"
                            : "",
                      });
                    }}
                    className={cn(
                      "mb-1 text-center text-xl font-bold",
                      formErrors.name && "border-destructive",
                    )}
                    maxLength={98}
                  />
                ) : (
                  <h1 className="flex items-center justify-center gap-1 text-xl font-bold md:text-2xl">
                    {creator.name}
                  </h1>
                )}

                {isEditingProfile ? (
                  <div className="mt-3">
                    <Label htmlFor="bio" className="text-sm">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={editedProfile.bio}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditedProfile({ ...editedProfile, bio: value });
                        setFormErrors({
                          ...formErrors,
                          bio:
                            value.length > 100
                              ? "Bio must be less than 101 characters"
                              : "",
                        });
                      }}
                      className={cn(
                        "mt-1 resize-none",
                        formErrors.bio && "border-destructive",
                      )}
                      rows={3}
                    />
                    {formErrors.bio && (
                      <p className="mt-1 text-xs text-destructive">
                        {formErrors.bio}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {creator.bio && creator.bio.length > 0
                      ? creator.bio
                      : "No bio provided"}
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {isEditingProfile ? (
              <div className="w-full space-y-4">
                <div className="mb-6 flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={cancelProfileEditing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={saveProfileChanges}
                    disabled={
                      updateProfileMutation.isLoading ||
                      !!formErrors.name ||
                      !!formErrors.bio
                    }
                  >
                    {updateProfileMutation.isLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-3">
                {creator.pageAsset && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Membership:</span>{" "}
                    {creator.pageAsset.code}
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>
                    Joined {new Date(creator.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={toggleSidebar}
          />
        )}

        <div className="relative flex-1">
          <div ref={contentRef} className="absolute inset-0 overflow-auto">
            <div className="p-1 pb-20 md:p-6">
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold md:text-3xl">
                  Creator Dashboard
                </h1>
              </div>

              <div className="mb-12">
                <h2 className="mb-4 text-xl font-bold">Membership Asset</h2>
                <Card className="mb-6 w-[350px] max-w-full text-center">
                  <CardHeader>
                    <CardTitle>Membership Asset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pageAsset ? (
                      <div>
                        <p className="badge badge-secondary font-bold">
                          {pageAsset.code}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No membership asset set
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Subscription Packages</h2>
                  {pageAsset && subscriptions && subscriptions.length < 3 && (
                    <AddTierModal creator={creator} />
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subscriptions && subscriptions.length > 0 ? (
                    subscriptions
                      .sort((a, b) => a.price - b.price)
                      .map((el) => (
                        <MemberShipCard
                          key={el.id}
                          creator={creator}
                          subscription={el as SubscriptionType}
                          pageAsset={pageAsset?.code}
                        />
                      ))
                  ) : (
                    <div className="col-span-full rounded-lg bg-muted/30 py-12 text-center">
                      <p className="text-muted-foreground">
                        No subscription packages yet. Create one to start
                        earning!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-xl font-bold">Recent Posts</h2>
                <div className="space-y-6">
                  {allCreatedPost.isLoading && (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardHeader>
                            <Skeleton className="mb-2 h-6 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="mb-2 h-4 w-full" />
                            <Skeleton className="mb-2 h-4 w-full" />
                            <Skeleton className="mb-4 h-4 w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {allCreatedPost.data?.pages.map((page, i) => (
                    <React.Fragment key={i}>
                      {page.posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          creator={post.creator}
                          likeCount={post._count.likes}
                          commentCount={post._count.comments}
                          priority={0}
                          locked={!!post.subscription}
                          show={true}
                          media={post.medias ?? []}
                        />
                      ))}
                    </React.Fragment>
                  ))}

                  {allCreatedPost.hasNextPage && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => allCreatedPost.fetchNextPage()}
                      disabled={allCreatedPost.isFetchingNextPage}
                    >
                      {allCreatedPost.isFetchingNextPage
                        ? "Loading more..."
                        : "Load More Posts"}
                    </Button>
                  )}

                  {allCreatedPost.data?.pages[0]?.posts.length === 0 && (
                    <div className="rounded-lg bg-muted/30 py-12 text-center">
                      <Grid3X3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-medium">No Posts Yet</h3>
                      <p className="mb-4 text-muted-foreground">
                        You haven&apos;t posted any content yet
                      </p>
                      <Link href="/fans/creator/posts">
                        <Button>Create Your First Post</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
