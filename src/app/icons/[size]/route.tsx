import { ImageResponse } from "next/og";

import { LOGO_GRADIENT, LogoGlyph } from "@/components/brand/logo";

/** The sizes `app/manifest.ts` lists; anything else is a 404. */
const SIZES = [192, 512];

/** GET /icons/192, /icons/512: the app icon for install prompts and TVs. */
export async function GET(_: Request, context: { params: Promise<{ size: string }> }) {
  const size = Number((await context.params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });

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
        <LogoGlyph size={Math.round(size * 0.62)} />
      </div>
    ),
    { width: size, height: size },
  );
}
