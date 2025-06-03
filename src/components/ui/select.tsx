import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("border rounded px-2 py-1 bg-background text-foreground", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select"; 