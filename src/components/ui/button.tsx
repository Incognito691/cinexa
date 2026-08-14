"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium",
    "transition-all duration-200 ease-out",
    // Focus ring — visible only for keyboard nav so it doesn't show on mouse click.
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Disabled state.
    "disabled:pointer-events-none disabled:opacity-50",
    // SVG icons.
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Active (pressed) state — global.
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        // ──────────────── Primary ────────────────
        default: [
          "bg-primary text-primary-foreground shadow-sm",
          "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20",
          "active:bg-primary/95",
        ].join(" "),

        // ──────────────── Brand (purple→pink gradient) ────────────────
        brand: [
          "bg-brand-gradient text-white shadow-md shadow-brand-from/25",
          "hover:opacity-95 hover:shadow-lg hover:shadow-brand-from/35",
          "active:opacity-90",
        ].join(" "),

        // ──────────────── Destructive ────────────────
        destructive: [
          "bg-destructive text-destructive-foreground shadow-sm",
          "hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/20",
          "active:bg-destructive/95",
        ].join(" "),

        // ──────────────── Outline ────────────────
        outline: [
          "border border-input bg-background shadow-sm",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
          "active:bg-accent/80",
        ].join(" "),

        // ──────────────── Secondary ────────────────
        secondary: [
          "bg-secondary text-secondary-foreground shadow-sm",
          "hover:bg-secondary/80 hover:shadow-md",
          "active:bg-secondary/70",
        ].join(" "),

        // ──────────────── Ghost ────────────────
        ghost: [
          "text-foreground/80",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80",
        ].join(" "),

        // ──────────────── Link ────────────────
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "active:underline",
        ].join(" "),

        // ──────────────── Glass (translucent, brand-tinted border) ────────────────
        glass: [
          "border border-white/[0.08] bg-white/[0.04] text-foreground backdrop-blur-md",
          "hover:bg-white/[0.08] hover:border-white/[0.15] hover:shadow-md",
          "active:bg-white/[0.12]",
        ].join(" "),

        // ──────────────── Pill (Stitch-style rounded-full hero CTA) ────────────────
        pill: [
          "rounded-full bg-primary text-white shadow-lg shadow-primary/30",
          "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40",
          "active:bg-primary/95 active:scale-[0.97]",
        ].join(" "),

        // ──────────────── Outline-brand ────────────────
        "outline-brand": [
          "border border-brand-from/40 bg-brand-from/10 text-foreground backdrop-blur",
          "hover:bg-brand-from/20 hover:border-brand-from/70",
          "active:bg-brand-from/25",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-sm",
        xl: "h-11 rounded-lg px-6 text-base",
        "2xl": "h-12 rounded-lg px-7 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };