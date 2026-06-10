import { buildChannelEntries } from "./channels.ts";
import { buildMixerEntries } from "./mixer.ts";
import type { OscEntry, OscRegistry } from "./types.ts";

export type { OscEntry, OscArgValue, OscRegistry } from "./types.ts";

export function buildRegistry(): { registry: OscRegistry; entries: OscEntry[] } {
  const allEntries: OscEntry[] = [
    ...buildChannelEntries("input",    "/input",    48),
    ...buildChannelEntries("stereo",   "/stereo",   3),
    ...buildChannelEntries("fxreturn", "/fxreturn", 4),
    ...buildChannelEntries("bus",      "/bus",      12),
    ...buildChannelEntries("dca",      "/dca",      8),
    ...buildChannelEntries("main",     "/main",     0),
    ...buildMixerEntries(),
  ];

  const registry: OscRegistry = new Map(allEntries.map(e => [e.address, e]));
  return { registry, entries: allEntries };
}
