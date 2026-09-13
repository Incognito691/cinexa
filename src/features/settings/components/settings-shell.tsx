import { cn } from "@/lib/utils";

/**
 * Layout primitives for the settings page.
 *
 * Deliberately flat: no gradients, no glow, no brand colour except on the one
 * control that needs to read as active. A settings page earns "premium" from
 * spacing, hairline borders and restraint, not from decoration — every
 * gradient here would compete with the content for attention and none of it
 * is content worth competing for.
 */

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-white/40">{description}</p>
        ) : null}
      </div>

      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        {children}
      </div>
    </section>
  );
}

/**
 * One labelled row. `control` sits right on wide screens and wraps beneath on
 * narrow ones, which is why this is flex-wrap rather than a two-column grid.
 */
export function SettingsRow({
  label,
  hint,
  control,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  control?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-white/90">{label}</p>
        {hint ? (
          <div className="max-w-prose text-xs leading-relaxed text-white/40">
            {hint}
          </div>
        ) : null}
      </div>
      {control ? <div className="shrink-0">{control}</div> : null}
    </div>
  );
}

/** A read-only value, right-aligned in a row. */
export function SettingsValue({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-white/60">{children}</span>;
}
