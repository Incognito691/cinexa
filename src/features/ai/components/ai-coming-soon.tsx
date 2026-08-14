import { ArrowUp, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { AuroraBackdrop } from "./aurora-backdrop";

/**
 * Empty state for the not-yet-built AI chat.
 *
 * Rather than a generic "coming soon" card, this shows a short mocked
 * exchange — it demonstrates the feature far better than a description does,
 * and gives the page something to look at. Nothing here is interactive; the
 * composer is deliberately inert so it never pretends to work.
 */

const EXCHANGE = [
  {
    role: "user" as const,
    text: "Something slow and beautiful, like Blade Runner 2049.",
  },
  {
    role: "ai" as const,
    text: "Then try Arrival — same patient camera, same melancholy, and it trades the neon for something quieter. If you want the neon, Ghost in the Shell (1995) is the ancestor of that whole look.",
  },
];

const SUGGESTIONS = [
  "What should I watch tonight?",
  "Explain the ending of Primer",
  "More like Parasite",
];

export function AiComingSoon() {
  return (
    <section className="relative flex min-h-[calc(100vh-9rem)] items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#070707] px-6 py-16">
      <AuroraBackdrop />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
        <span
          className="reveal inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl"
          style={{ animationDelay: "40ms" }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-from opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-from" />
          </span>
          In development
        </span>

        <h1
          className="reveal mt-7 text-center text-[2.75rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl"
          style={{ animationDelay: "120ms" }}
        >
          Your film critic,
          <br />
          <span className="text-brand-gradient">always on call.</span>
        </h1>

        <p
          className="reveal mt-5 max-w-md text-center text-sm leading-relaxed text-white/50 sm:text-base"
          style={{ animationDelay: "200ms" }}
        >
          Describe a mood, a half-remembered plot, or a film you loved — and
          talk it through until you know exactly what to watch.
        </p>

        {/* Mocked exchange — the actual product demo. */}
        <div
          className="reveal mt-12 w-full space-y-3"
          style={{ animationDelay: "300ms" }}
        >
          {EXCHANGE.map((message, idx) => (
            <Bubble key={idx} role={message.role} delay={360 + idx * 140}>
              {message.text}
            </Bubble>
          ))}

          <Bubble role="ai" delay={640}>
            <span className="flex items-center gap-1.5 py-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-white/70"
                  style={{ animationDelay: `${dot * 160}ms` }}
                />
              ))}
            </span>
          </Bubble>
        </div>

        {/* Suggested prompts — the hover target on this page. */}
        <ul
          className="reveal mt-10 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: "760ms" }}
        >
          {SUGGESTIONS.map((prompt) => (
            <li
              key={prompt}
              className={cn(
                "group cursor-default rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2",
                "text-xs text-white/50 backdrop-blur-md",
                "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
                "hover:shadow-[0_8px_28px_-10px_hsl(var(--brand-from)/0.7)]",
              )}
            >
              {prompt}
            </li>
          ))}
        </ul>

        {/* Inert composer — shows the shape of the feature, does nothing. */}
        <div
          className="reveal mt-8 flex w-full max-w-lg items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-5 pr-2.5 backdrop-blur-xl"
          style={{ animationDelay: "840ms" }}
        >
          <span className="flex-1 text-left text-sm text-white/25">
            Ask about any movie…
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/25">
            <ArrowUp className="h-4 w-4" />
          </span>
        </div>

        <p
          className="reveal mt-6 flex items-center gap-1.5 text-[11px] text-white/25"
          style={{ animationDelay: "900ms" }}
        >
          <Sparkles className="h-3 w-3" />
          Movies only at launch — TV support comes later.
        </p>
      </div>
    </section>
  );
}

function Bubble({
  role,
  delay,
  children,
}: {
  role: "user" | "ai";
  delay: number;
  children: React.ReactNode;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn("reveal flex", isUser ? "justify-end" : "justify-start")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur-xl sm:max-w-[78%]",
          isUser
            ? "rounded-br-md bg-white/[0.09] text-white/85"
            : "rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-white/65",
        )}
      >
        {children}
      </div>
    </div>
  );
}
