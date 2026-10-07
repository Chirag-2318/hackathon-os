import * as React from "react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

/**
 * C16 — Form Field Wrapper
 * §4 C16: Height 40 (32 compact), r-control, 1px border-input, surface fill, 
 * label above (Label 13/600), helper text below (Caption), 
 * error text #A82D2D with icon.
 */

interface FormFieldProps extends React.ComponentProps<"div"> {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  helperText?: React.ReactNode;
  children: React.ReactNode;
  density?: "comfortable" | "compact";
}

function FormField({
  label,
  htmlFor,
  error,
  helperText,
  children,
  density = "comfortable",
  className,
  ...props
}: FormFieldProps) {
  const isCompact = density === "compact";
  
  return (
    <div 
      className={cn("flex flex-col gap-1.5 w-full", className)} 
      data-slot="form-field"
      {...props}
    >
      {label && (
        <Label 
          htmlFor={htmlFor} 
          className={cn(
            "text-label text-ink mb-0.5",
            error && "text-danger-text"
          )}
        >
          {label}
        </Label>
      )}
      
      {/* 
        We pass density context down to children through standard CSS classes 
        or assume children consume it via context. 
        For standard inputs, we can target them with a CSS class on a wrapper 
      */}
      <div className={cn(
        "relative",
        isCompact ? "[&>input]:h-8 [&>select]:h-8 [&>button]:h-8" : "[&>input]:h-10 [&>select]:h-10 [&>button]:h-10",
        // error state styling applied to direct form control children
        error && "[&>input]:border-danger-stroke [&>input]:ring-danger-stroke/20 [&>textarea]:border-danger-stroke [&>select]:border-danger-stroke"
      )}>
        {children}
      </div>

      {error ? (
        <p className="flex items-start gap-1.5 text-caption text-danger-text mt-0.5">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-caption text-ink-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
