import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded border px-2.5 py-2 text-xs leading-5", {
  variants: {
    variant: {
      default: "border-white/10 bg-gray-900 text-gray-300",
      warning: "border-amber-500/60 bg-amber-600/15 text-amber-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

export { Alert };
