"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The button.
 *
 * Every clickable control on the site routes through this — including the
 * ones that are links, via `asChild`. It previously existed with ten variants
 * and was imported by three files, while the rest of the app hand-rolled
 * classes; an audit found **four corner radii, five heights and seven padding
 * values** across those copies. The variant list below is deliberately short
 * so there's one obvious answer per situation and no room to drift again.
 *
 * Shape rules, applied uniformly:
 *   - Text buttons are `rounded-xl`. Pills (`rounded-full`) are reserved for
 *     icon-only buttons, where a circle is the intended shape rather than an
 *     accident of a different radius token.
 *   - Three heights, nothing between them: 36 / 40 / 48px.
 *
 * Accessibility, per the project's a11y guidance:
 *   - Renders a native `<button>` (or, with `asChild`, whatever element you
 *     pass) rather than a `div` with a role, so keyboard and AT behaviour
 *     comes for free.
 *   - `:focus-visible` is styled explicitly — a ring offset from the surface,
 *     shown for keyboard focus but not on mouse click.
 *   - Use `aria-disabled` instead of `disabled` when the control should stay
 *     reachable by keyboard so a user can land on it and learn *why* it's
 *     unavailable; `disabled` drops it from the focus order entirely. Both are
 *     styled the same.
 *   - Icon-only buttons have no text, so they need an `aria-label`.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transition-none",
  ].join(" "),
  {
    variants: {
      variant: {
        /** The one main action on a view. Red. */
        primary: [
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20",
          "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30",
        ].join(" "),

        /** Everything alongside a primary action. Translucent, bordered. */
        secondary: [
          "border border-white/[0.1] bg-white/[0.05] text-foreground backdrop-blur-md",
          "hover:border-white/20 hover:bg-white/[0.1]",
        ].join(" "),

        /** Low-emphasis: toolbars, icon controls, dismissals. */
        ghost: [
          "text-foreground/70",
          "hover:bg-white/[0.06] hover:text-foreground",
        ].join(" "),

        /** Irreversible actions. Restrained until hovered. */
        destructive: [
          "border border-rose-500/40 bg-rose-500/15 text-rose-200",
          "hover:border-rose-500/60 hover:bg-rose-500/25",
        ].join(" "),

        /** Inline text link that needs button semantics. */
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-xl px-3.5 text-xs [&_svg]:size-3.5",
        default: "h-10 rounded-xl px-4 [&_svg]:size-4",
        lg: "h-12 rounded-xl px-6 text-base [&_svg]:size-5",
        // Circles on purpose — see the shape rules above.
        icon: "h-10 w-10 rounded-full p-0 [&_svg]:size-4",
        "icon-sm": "h-9 w-9 rounded-full p-0 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 rounded-full p-0 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (a `<Link>`, say) keeping these styles. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        // Buttons inside a form default to `submit`, which has caught this
        // codebase before. Explicit unless the caller says otherwise.
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
