"use client";

import { useEffect, useState } from "react";

import { usePersistedString } from "@/hooks/use-persisted-string";
import {
  DEFAULT_SOURCE_ID,
  SOURCES,
  SOURCE_IDS,
  SOURCE_PREFERENCE_KEY,
  getSource,
} from "@/features/watch/lib/sources";

import { SettingsRow, SettingsSection } from "./settings-shell";
import { Segmented } from "./segmented";

const OPTIONS = SOURCES.map((s) => ({ value: s.id, label: s.label }));

/**
 * Which provider a player opens on.
 *
 * Stored in localStorage rather than the database on purpose: it's a
 * device-level preference (the provider that isn't blocked on *this* network)
 * and login is optional, so tying it to an account would make it unavailable
 * to most visitors.
 *
 * Same `mounted` gate as the theme row — `usePersistedString` returns the
 * default until it reads localStorage on mount.
 */
export function PlaybackSettings() {
  const [preferred, setPreferred] = usePersistedString(
    SOURCE_PREFERENCE_KEY,
    DEFAULT_SOURCE_ID,
    SOURCE_IDS,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <SettingsSection
      title="Playback"
      description="Applies to this browser. Playback runs in the provider's own embedded player, so these are the only controls this app has over it."
    >
      <SettingsRow
        label="Default source"
        hint={
          mounted
            ? getSource(preferred).hint
            : "Which provider a title opens on."
        }
        control={
          mounted ? (
            <Segmented
              name="Default source"
              value={preferred}
              options={OPTIONS}
              onChange={setPreferred}
            />
          ) : (
            <div className="h-[34px] w-[250px] rounded-xl border border-white/[0.08] bg-black/20" />
          )
        }
      />
      <SettingsRow
        label="Resume where you left off"
        hint="Only the Primary source reports playback position. On the others a title still reaches Continue Watching, but without a progress bar or a resume point."
        control={
          <span className="text-xs text-white/40">
            Provider-dependent
          </span>
        }
      />
    </SettingsSection>
  );
}
