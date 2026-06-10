/**
 * Parameter — a single mixer value reachable via the SQ network protocol.
 */

import { EventEmitter } from "node:events";
import { Connection } from "../transport/connection";

export type Unsubscribe = () => void;

// Calibrated from real hardware:
//   wire = 0x8000 + dB * 256  (range 0–35328, 0 = −∞)
//   dB   = (wire − 0x8000) / 256
const FADER_MAX_WIRE = 35328; // +10 dB

/** dB to normalised fader position (0.0–1.0) for visual display. */
export function dbToFader(db: number): number {
  if (!isFinite(db)) return 0;
  const wire = Math.round(0x8000 + db * 256);
  return Math.max(0, Math.min(1, wire / FADER_MAX_WIRE));
}

/** Normalised fader position (0.0–1.0) to dB. */
export function faderToDb(norm: number): number {
  if (norm <= 0) return -Infinity;
  return (norm * FADER_MAX_WIRE - 0x8000) / 256;
}
