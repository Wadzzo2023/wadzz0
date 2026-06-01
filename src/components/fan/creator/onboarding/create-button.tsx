"use client";
import { useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import BrandCreationForm from "./create-form";
import { Creator } from "@prisma/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/shadcn/ui/card";
import { Pencil, Sparkles } from "lucide-react";

export type CreateBrand = {
  name: string;
  bio: string | null;
  profileUrl: string | null;
  coverUrl: string | null;
  vanityURL: string | null;
  pageAsset: {
    code: string;
    thumbnail: string | null;
  } | null;
};

export default function CreateBrandButton({
  creator,
  edit,
}: {
  creator?: CreateBrand;
  edit?: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex h-full items-center justify-center bg-background p-4">
      {edit ? (
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          className="gap-2 border-border font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary hover:shadow-sm"
        >
          <Pencil className="h-4 w-4" />
          Update Your Brand
        </Button>
      ) : (
        <Card className="w-full max-w-sm overflow-hidden border border-border shadow-xl">
          {/* Decorative top bar */}
          <div className="h-1.5 w-full bg-primary" />

          <CardHeader className="pb-2 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Create Your Brand
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Build your unique identity and start connecting with your audience today.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 pt-4">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full gap-2 bg-primary py-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              Get Started
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Free to create · No credit card required
            </p>
          </CardContent>
        </Card>
      )}

      <BrandCreationForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        creator={creator}
        edit={edit}
      />
    </div>
  );
}