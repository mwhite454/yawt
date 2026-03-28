import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-7 w-full appearance-none rounded border border-gray-700 bg-gray-800 px-2 py-1 pr-7 text-[11px] text-gray-200 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
    </div>
  );
});
Select.displayName = "Select";

export { Select };
