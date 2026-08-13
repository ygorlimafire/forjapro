import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: layout + accessibility + FORJA brand typography (all buttons = Barlow Condensed bold uppercase)
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding whitespace-nowrap transition-all outline-none select-none font-display font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--copper-600]/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Copper primary — diagonal cut via .btn-clip ::before (bg handled in CSS)
        default:
          "btn-clip text-white",
        // Dark border, transparent fill (Cancel, secondary actions)
        secondary:
          "border-[1.5px] border-[--ink-900] text-[--ink-900] bg-transparent hover:bg-[--ink-900]/[0.06]",
        // Light border, steel text (Export, tertiary/ghost-like actions)
        outline:
          "border border-[--border-200] text-[--steel-600] bg-transparent hover:border-[--steel-600] hover:text-[--ink-900]",
        // No border, subtle hover (nav icons, inline actions)
        ghost:
          "bg-transparent text-[--steel-600] hover:bg-[--steel-100] hover:text-[--ink-900]",
        // Solid danger for destructive confirmations
        destructive:
          "bg-[--danger-text] text-white hover:brightness-90",
        link: "text-[--copper-600] underline-offset-4 hover:underline",
      },
      size: {
        default:  "h-10 gap-2 px-5 text-[13px]",
        xs:       "h-7 gap-1 px-2.5 text-[11px]",
        sm:       "h-8 gap-1.5 px-3 text-[12px]",
        lg:       "h-12 gap-2 px-6 text-sm",
        icon:     "size-10",
        "icon-xs":  "size-7",
        "icon-sm":  "size-8",
        "icon-lg":  "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
