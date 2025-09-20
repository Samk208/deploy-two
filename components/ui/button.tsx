import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"

const buttonVariants = (props?: { variant?: ButtonVariant; size?: ButtonSize }) => {
  const variant = props?.variant || "default"
  const size = props?.size || "default"
  
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none",
    {
      // Variants
      "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2": variant === "default",
      "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2": variant === "destructive",
      "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700": variant === "outline",
      "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600": variant === "secondary",
      "text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800": variant === "ghost",
      "text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:text-indigo-400": variant === "link",
      
      // Sizes
      "h-9 px-4 py-2": size === "default",
      "h-8 px-3 py-1.5 text-sm": size === "sm",
      "h-11 px-6 py-2.5": size === "lg",
      "h-9 w-9 p-0": size === "icon",
    }
  )
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={buttonVariants({ variant, size })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
