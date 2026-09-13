import { ImageResponse } from "next/og";

/**
 * Generated favicon.
 *
 * A film strip, matching the sidebar mark. Two earlier attempts were wrong for
 * instructive reasons: a purple→pink gradient "C" advertised a palette nothing
 * else in the app uses, and a bare play triangle on red reads as YouTube's
 * logo rather than as this product.
 *
 * The path data is Lucide's `Film` icon, inlined rather than imported —
 * `next/og` renders through Satori, which needs plain SVG primitives, and
 * inlining keeps the favicon from depending on the icon library's runtime.
 * Stroke geometry is scaled from Lucide's 24px grid to this 32px canvas.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e50914",
          borderRadius: 8,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18" />
          <path d="M3 7.5h4" />
          <path d="M3 12h18" />
          <path d="M3 16.5h4" />
          <path d="M17 3v18" />
          <path d="M17 7.5h4" />
          <path d="M17 16.5h4" />
        </svg>
      </div>
    ),
    size,
  );
}
