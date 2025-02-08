"use client";

import { useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import BrandCreationForm from "./create-form";
import { Creator } from "@prisma/client";

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
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        {edit ? "Update Your data" : "Create Your Brand"}
      </Button>
      <BrandCreationForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        creator={creator}
        edit={edit}
      />
    </>
  );
}
