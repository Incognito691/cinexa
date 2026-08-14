import { Apple, Download, Play, Tv } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-xl sm:p-12">
      {/* Ambient purple/pink glow that bleeds through the glass */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(168,85,247,0.45),transparent_60%),radial-gradient(40%_40%_at_85%_100%,rgba(236,72,153,0.35),transparent_60%)]"
      />

      <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/65 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-from" /> Always-on
          </p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Bring the cinema{" "}
            <span className="text-brand-gradient bg-clip-text text-transparent">
              home.
            </span>
          </h2>
          <p className="max-w-xl text-sm text-white/65 sm:text-base">
            Stream the latest blockbusters, classics, and TV on any screen.
            Pause here, resume there — your watch history follows you.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="brand" size="xl" className="rounded-full">
              <Apple className="h-4 w-4" />
              Get on iOS
            </Button>
            <Button variant="glass" size="xl" className="rounded-full">
              <Play className="h-4 w-4 fill-current" />
              Get on Android
            </Button>
            <Button variant="ghost" size="xl" className="rounded-full text-white/85">
              <Tv className="h-4 w-4" />
              Watch on TV
              <Download className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Decorative glass-orbs cluster */}
        <div className="relative h-40 w-full max-w-[260px] shrink-0 sm:h-48 sm:w-[280px]">
          <span className="absolute left-0 top-4 h-16 w-16 rounded-2xl border border-white/[0.12] bg-white/[0.06] shadow-2xl shadow-brand-from/20 backdrop-blur-md" />
          <span className="absolute left-12 top-12 h-20 w-20 rounded-3xl border border-white/[0.1] bg-white/[0.04] shadow-2xl shadow-brand-to/20 backdrop-blur-md" />
          <span className="absolute left-28 top-2 h-14 w-14 rounded-2xl border border-white/[0.14] bg-white/[0.05] shadow-xl backdrop-blur-md" />
          <span className="absolute left-44 top-16 h-10 w-10 rounded-xl border border-white/[0.1] bg-brand-gradient/20 backdrop-blur-md" />
          <span className="absolute left-32 top-24 h-8 w-8 rounded-full bg-brand-gradient shadow-lg shadow-brand-from/40" />
        </div>
      </div>
    </section>
  );
}