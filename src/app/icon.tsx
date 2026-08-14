import { ImageResponse } from "next/og";

/**
 * Generated favicon — the brand mark on the purple→pink gradient used by the
 * sidebar logo. Generated rather than committed as a binary so it stays in
 * sync with the palette and there's no asset to lose.
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
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
          borderRadius: 7,
          color: "white",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    size,
  );
}
