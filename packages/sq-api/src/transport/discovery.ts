/**
 * UDP discovery — "SQ Find" broadcast on port 51320.
 * Source: codeBlob/alt/h.java
 */

import * as dgram from "node:dgram";

export const DISCOVERY_UDP_PORT = 51320;

export type MixerFamily = "SQ" | "CQ" | "QU" | "GLD" | "TLD" | "Bridge";

const DISCOVERY_STRINGS: Record<MixerFamily, string> = {
  SQ: "SQ Find",
  CQ: "CQ Find",
  QU: "QU Find",
  GLD: "GLD Find",
  TLD: "TLD Find",
  Bridge: "Bridge Find",
};

export interface DiscoveredMixer {
  family: MixerFamily;
  address: string;
}

export function discover(
  family: MixerFamily = "SQ",
  timeoutMs = 2000,
  broadcastAddr = "255.255.255.255",
): Promise<DiscoveredMixer> {
  return new Promise((resolve, reject) => {
    const sock = dgram.createSocket("udp4");
    let settled = false;

    const done = (result: DiscoveredMixer | Error) => {
      if (settled) return;
      settled = true;
      try { sock.close(); } catch {}
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    sock.bind(0, () => {
      sock.setBroadcast(true);
      sock.on("message", (_msg, rinfo) => done({ family, address: rinfo.address }));
      sock.on("error", (e) => done(e));

      const probe = Buffer.from(DISCOVERY_STRINGS[family], "ascii");
      sock.send(probe, DISCOVERY_UDP_PORT, broadcastAddr, (err) => {
        if (err) done(err);
      });

      setTimeout(() => done(new Error(`Discovery timeout after ${timeoutMs}ms`)), timeoutMs);
    });
  });
}
