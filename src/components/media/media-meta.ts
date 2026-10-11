import type { MediaType } from "@prisma/client";
import { Box, Image as ImageIcon, Music, Video, type LucideIcon } from "lucide-react";

/** Label and icon for each kind of item content. */
export const MEDIA_META: Record<MediaType, { label: string; icon: LucideIcon }> = {
  IMAGE: { label: "Image", icon: ImageIcon },
  VIDEO: { label: "Video", icon: Video },
  MUSIC: { label: "Audio", icon: Music },
  THREE_D: { label: "3D", icon: Box },
};

/** Every content kind, in display order (no runtime Prisma import, so client-safe). */
export const MEDIA_TYPES = Object.keys(MEDIA_META) as MediaType[];
