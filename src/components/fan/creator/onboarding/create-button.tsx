"use client";

import { useState } from "react";
import { Button } from "~/components/shadcn/ui/button";
import BrandCreationForm from "./create-form";
import { Creator } from "@prisma/client";

export default function CreateBrandButton({ creator }: { creator?: Creator }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>Create Your Brand</Button>
      <BrandCreationForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        creator={creator}
      />
    </>
  );
}
