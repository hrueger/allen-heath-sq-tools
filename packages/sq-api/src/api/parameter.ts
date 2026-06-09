/**
 * Parameter — a single mixer value reachable via the SQ network protocol.
 */

import { EventEmitter } from "events";
import { Connection } from "../transport/connection";

export type Unsubscribe = () => void;

/** dB to normalized fader position (0.0–1.0). Approximate SQ fader law. */
export function dbToFader(db: number): number {
  if (!isFinite(db) || db <= -90) return 0;
  if (db >= 10) return 1.0;
  const points: [number, number][] = [
    [-90, 0], [-60, 0.04], [-40, 0.16], [-30, 0.25], [-20, 0.37],
    [-10, 0.5], [-5, 0.625], [0, 0.75], [5, 0.875], [10, 1.0],
  ];
  for (let i = 1; i < points.length; i++) {
    const [d0, f0] = points[i - 1], [d1, f1] = points[i];
    if (db <= d1) return f0 + ((db - d0) / (d1 - d0)) * (f1 - f0);
  }
  return 1.0;
}

export function faderToDb(fader: number): number {
  if (fader <= 0) return -Infinity;
  const points: [number, number][] = [
    [0.04, -60], [0.16, -40], [0.25, -30], [0.37, -20],
    [0.5, -10], [0.625, -5], [0.75, 0], [0.875, 5], [1.0, 10],
  ];
  if (fader < points[0][0]) return -Infinity;
  if (fader >= 1.0) return 10;
  for (let i = 1; i < points.length; i++) {
    const [f0, d0] = points[i - 1], [f1, d1] = points[i];
    if (fader <= f1) return d0 + ((fader - f0) / (f1 - f0)) * (d1 - d0);
  }
  return 10;
}
