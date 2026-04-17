"use client";
import { Plus, Minus } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function MapControls({ onZoomIn, onZoomOut }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-24 z-20 flex flex-col gap-3">
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
