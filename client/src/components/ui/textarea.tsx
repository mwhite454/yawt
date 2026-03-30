import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-20 w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-white outline-none transition-colors placeholder:text-gray-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
