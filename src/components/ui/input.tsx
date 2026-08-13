import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // FORJA: h-10 (40px), no radius (0px via theme), copper-600 focus border
        "h-10 w-full min-w-0 border border-[--border-200] bg-white px-3 py-2 text-sm text-foreground transition-colors outline-none",
        "placeholder:text-[--steel-300]",
        "focus-visible:border-[--copper-600] focus-visible:border-[1.5px] focus-visible:ring-0 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[--steel-100] disabled:opacity-50",
        "aria-invalid:border-[--danger-text] aria-invalid:ring-2 aria-invalid:ring-[--danger-text]/20",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
