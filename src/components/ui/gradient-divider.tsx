// /src/components/ui/gradient-divider.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const gradientDividerVariants = cva(
  "w-full bg-gradient-to-r from-transparent to-transparent",
  {
    variants: {
      variant: {
        default: "via-secondary/30",
        primary: "via-primary/30", 
        accent: "via-accent/30",
        muted: "via-gray-500/20",
        subtle: "via-gray-400/10",
      },
      size: {
        default: "h-px",
        thick: "h-0.5",
        thin: "h-[0.5px]",
      },
      spacing: {
        default: "my-6",
        sm: "my-4",
        lg: "my-8",
        xl: "my-12",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default", 
      spacing: "default",
    },
  }
)

export interface GradientDividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientDividerVariants> {}

const GradientDivider = React.forwardRef<HTMLDivElement, GradientDividerProps>(
  ({ className, variant, size, spacing, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gradientDividerVariants({ variant, size, spacing, className }))}
        {...props}
      />
    )
  }
)
GradientDivider.displayName = "GradientDivider"

export { GradientDivider, gradientDividerVariants }