import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild, children, ...props }, ref) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
      {
        "bg-foreground text-background hover:opacity-90":
          variant === "default",
        "border border-border bg-transparent hover:bg-muted":
          variant === "outline",
        "hover:bg-muted": variant === "ghost",
        "h-10 px-6": size === "default",
        "h-9 px-4 text-sm": size === "sm",
        "h-12 px-8 text-base": size === "lg",
      },
      className
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        ...props,
        className: cn(baseClasses, child.props?.className),
      });
    }

    return (
      <button
        className={baseClasses}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };

