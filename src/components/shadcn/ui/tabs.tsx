"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "~/lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * Two looks: `pill` (default) — a segmented control for switching views in a
 * card; `line` — underlined tabs for a page's main sections. Triggers pick up
 * the list's variant, so pages only set it once.
 */
type Variant = "pill" | "line"
const VariantContext = React.createContext<Variant>("pill")

const LIST: Record<Variant, string> = {
  pill: "inline-flex h-10 items-center justify-center gap-1 rounded-lg border bg-muted/60 p-1 text-muted-foreground",
  line: "flex h-auto w-full items-stretch justify-start gap-1 overflow-x-auto border-b text-muted-foreground [scrollbar-width:none]",
}
const TRIGGER: Record<Variant, string> = {
  pill: "rounded-md px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
  line: "relative -mb-px rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:text-foreground",
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: Variant }
>(({ className, variant = "pill", ...props }, ref) => (
  <VariantContext.Provider value={variant}>
    <TabsPrimitive.List ref={ref} className={cn(LIST[variant], className)} {...props} />
  </VariantContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(VariantContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        TRIGGER[variant],
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

/** A count after a tab label: `Entries <TabCount n={4} />`. */
function TabCount({ n }: { n: number }) {
  return <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{n.toLocaleString()}</span>
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabCount }
