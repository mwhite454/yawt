import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded border border-transparent text-[11px] font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:border-blue-500",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-blue-500",
        secondary: "bg-secondary text-secondary-foreground hover:bg-gray-700",
        outline:
          "border-border bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white",
        ghost: "text-gray-400 hover:bg-gray-800 hover:text-white",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        link: "text-gray-300 underline-offset-4 hover:text-white hover:underline",
      },
      size: {
        default: "h-7 px-2.5 py-1",
        sm: "h-6 px-2 py-0.5 text-[10px]",
        lg: "h-8 px-3 py-1.5",
        icon: "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
