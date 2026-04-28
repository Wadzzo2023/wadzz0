"use client";
import { Plus, Minus } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { getCookie } from "cookies-next";
import { useState } from "react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function MapControls({ onZoomIn, onZoomOut }: MapControlsProps) {
  const [layoutMode] = useState<"modern" | "legacy">(() => {
    const cookieMode = getCookie("wadzzo-layout-mode");
    if (cookieMode === "legacy" || cookieMode === "modern") {
      return cookieMode;
    }
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("layoutMode");
      if (storedMode === "legacy" || storedMode === "modern") {
        return storedMode;
      }
    }
    return "modern";
  });

  return (
    <div className={`absolute right-4 z-20 flex flex-col gap-3 ${layoutMode === "modern" ? "top-14" : "top-16"}`}>
      <div className="space-y-1 rounded-2xl border border-white/30 bg-white/90 p-2 shadow-xl backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <div className="mx-2 h-px bg-gray-200" />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
