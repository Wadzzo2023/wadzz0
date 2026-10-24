/** Class strings shared by every "sticker" card (items, collection, creators, bounties), so they all move and look the same. */
export const stickerCard =
  "group relative rounded-[1.4rem] border-2 border-foreground/10 bg-surface p-2 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:-rotate-1 hover:border-foreground hover:shadow-[6px_7px_0_0_hsl(var(--primary))]";

/** Small dark label over artwork (media type, copies, status). */
export const artChip = "flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white";

/** Big condensed word tabs (Marketplace kinds, Collection, creator pages). */
export const wordTab = "display relative -mb-0.5 flex shrink-0 items-center gap-2 border-b-[3px] pb-2 text-3xl transition-colors";
export const wordTabOn = "border-primary text-foreground";
export const wordTabOff = "border-transparent text-muted-foreground hover:text-foreground";
export const wordTabList = "no-scrollbar flex gap-6 overflow-x-auto border-b-2 border-dashed border-foreground/10";
