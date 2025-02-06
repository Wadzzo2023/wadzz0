"use client"

import { useState } from "react"
import { Button } from "~/components/shadcn/ui/button"
import BrandCreationForm from "./create-form"

export default function CreateBrandButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>Create Your Brand</Button>
      <BrandCreationForm isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  )
}

