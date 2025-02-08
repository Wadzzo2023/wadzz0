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
    <div className="flex h-screen items-center justify-center p-4">
      {edit ? (
        <Button onClick={() => setIsDialogOpen(true)}>
          {edit ? "Update Your data" : "Create Your Brand"}
        </Button>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Brand Creation
            </CardTitle>
            <CardDescription className="text-center">
              Start your journey by creating your unique brand identity
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="w-full sm:w-auto"
            >
              Create Your Brand
            </Button>
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
