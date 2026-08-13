"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center justify-start text-muted-foreground group-data-horizontal/tabs:h-fit group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // Pill/chip style (kept for compat, rarely used in FORJA)
        default: "w-fit rounded-lg bg-muted p-[3px] gap-1",
        // Line underline style — FORJA standard for all page-level tabs
        line: "w-full gap-0 rounded-none bg-transparent p-0 border-b border-[--border-200]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base layout + FORJA typography
        "relative inline-flex items-center justify-center gap-1.5 px-4 py-2.5",
        "font-display text-[13px] font-bold uppercase tracking-[0.04em] whitespace-nowrap",
        "text-[--steel-600] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--copper-600]/40",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // Active state: ink-900 text
        "data-active:text-[--ink-900]",
        "hover:text-[--ink-900]",

        // Copper underline via ::after (only visible in line variant via opacity)
        "after:absolute after:bg-[--copper-600] after:opacity-0 after:transition-opacity",
        "group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-[3px]",
        "group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-px group-data-vertical/tabs:after:w-[3px]",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",

        // Default (pill) variant: active = background fill
        "group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:shadow-sm",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
