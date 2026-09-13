"use client";

import { cn } from "@/lib/utils";

/**
 * A small segmented control — the one interactive shape this page repeats.
 *
 * Radio inputs rather than buttons: arrow keys move between options and the
 * group announces itself as a single choice, both of which a row of buttons
 * would have to reimplement by hand. The visible pill is the label; the input
 * is `sr-only` but still the thing being focused, so focus rings land on the
 * right element.
 */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        "inline-flex rounded-xl border border-white/[0.08] bg-black/20 p-1",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition",
              "focus-within:ring-2 focus-within:ring-white/30",
              active
                ? "bg-white/[0.12] text-white"
                : "text-white/50 hover:text-white/80",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
