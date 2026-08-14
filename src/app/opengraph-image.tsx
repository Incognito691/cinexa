import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";

/**
 * Default Open Graph card, used for any page that doesn't supply its own
 * image. Detail pages will override this by passing a TMDB backdrop to
 * `buildMetadata({ images })`.
 */

export const alt = `${SITE_NAME} — Premium Movie & TV Streaming`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#090909",
          padding: 80,
          // Matches the app shell's ambient purple/pink radial backdrop.
          backgroundImage:
            "radial-gradient(60% 55% at 15% 0%, rgba(168,85,247,0.45), transparent 70%), radial-gradient(55% 50% at 85% 10%, rgba(236,72,153,0.4), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              borderRadius: 16,
              color: "white",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div
            style={{
              color: "white",
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: 8,
            }}
          >
            {SITE_NAME.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            color: "white",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Premium Movie &amp; TV Streaming
        </div>

        <div
          style={{
            marginTop: 24,
            color: "rgba(255,255,255,0.6)",
            fontSize: 30,
            maxWidth: 860,
            lineHeight: 1.4,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
