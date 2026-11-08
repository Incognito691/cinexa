import { ImageResponse } from "next/og";

import { LOGO_GRADIENT, LogoGlyph } from "@/components/brand/logo";

/** Generated favicon: the same mark as the sidebar (components/brand/logo.tsx). */

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
          backgroundImage: LOGO_GRADIENT,
          borderRadius: 9,
        }}
      >
        <LogoGlyph size={22} />
      </div>
    ),
    size,
  );
}
