import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// 50pt tall, full-width pills: comfortable one-handed tap targets (HIG minimum is 44pt).
const buttonVariants = cva(
  "inline-flex h-[50px] w-full select-none items-center justify-center gap-2 rounded-full px-6 text-[17px] font-semibold tracking-[-0.01em] transition-[transform,opacity] duration-150 active:scale-[0.98] active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-fill text-foreground",
        plain: "text-accent",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp ref={ref} className={cn(buttonVariants({ variant, className }))} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
