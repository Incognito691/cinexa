import { ImageResponse } from "next/og";

import { LOGO_GRADIENT, LogoGlyph } from "@/components/brand/logo";

/** Home-screen icon for iPhone and iPad. iOS rounds the corners itself. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <LogoGlyph size={124} />
      </div>
    ),
    size,
  );
}
