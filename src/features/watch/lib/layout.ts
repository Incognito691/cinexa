/**
 * Watch-page layout constants.
 *
 * Deliberately NOT in `watch-player.tsx`: that module is `"use client"`, and a
 * server component importing a plain value from a client module gets a client
 * *reference* rather than the value — the constant silently became a function
 * that throws, which rendered `--watch-chrome` as garbage and made the player's
 * `calc()` invalid. Shared constants belong in a module with no directive.
 */

/**
 * Vertical space the player is *not* allowed to use: the episode bar above it,
 * the source row and hint below it, plus the shell's own padding. The player's
 * width is derived from the leftover height, so if any of those rows change
 * height this number moves with them.
 */
export const WATCH_CHROME_PX = 170;

/** Width expression shared by the frame and the control rows beneath it. */
export const WATCH_WIDTH_CLASS =
  "max-w-[min(1600px,calc((100vh-var(--watch-chrome))*16/9))]";
