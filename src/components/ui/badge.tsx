import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type BadgeVariant =
  | "success" | "warning" | "danger" | "info" | "neutral"
  | "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const badgeVariants = cva(
  // Base: flat, rect, Barlow Condensed uppercase — no radius (0px via theme)
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-[10px] font-display text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // ── FORJA PRO semantic status variants ──
        success:
          "bg-[--success-bg] text-[--success-text]",
        warning:
          "bg-[--warning-bg] text-[--warning-text]",
        danger:
          "bg-[--danger-bg] text-[--danger-text]",
        info:
          "bg-[--info-bg] text-[--info-text]",
        neutral:
          "bg-[--steel-100] text-[--steel-600]",

        // ── generic shadcn-compat variants (kept for backward compat) ──
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-[--steel-100] text-[--steel-600]",
        destructive:
          "bg-[--danger-bg] text-[--danger-text]",
        outline:
          "border-border text-foreground bg-transparent",
        ghost:
          "bg-transparent text-muted-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
