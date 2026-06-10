import { faderToDb } from '@allen-heath-sq-tools/api';

/** Convert raw wire-level value to dB. ch.level stores wire format. */
export function levelToDb(wireLevel: number): number {
  const fader = (wireLevel - 0x7f9d) / 0x1000 + 0.5;
  return faderToDb(Math.max(0, Math.min(1, fader)));
}

/** Normalized 0-1 position from wire-level for bar display. */
export function levelNorm(wireLevel: number): number {
  return Math.max(0, Math.min(1, (wireLevel - 0x7f9d) / 0x1000 + 0.5));
}

export function formatDb(db: number, decimals = 1): string {
  if (!isFinite(db) || db <= -90) return '-∞';
  return `${db >= 0 ? '+' : ''}${db.toFixed(decimals)}`;
}

export function formatDbUnit(db: number, decimals = 1): string {
  return `${formatDb(db, decimals)}dB`;
}

export function formatHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)}kHz`;
  return `${Math.round(hz)}Hz`;
}

export function formatMs(ms: number): string {
  return ms < 10 ? `${ms.toFixed(2)}ms` : `${ms.toFixed(1)}ms`;
}

export function formatPan(pan: number): string {
  if (Math.abs(pan) < 0.015) return 'CTR';
  const pct = Math.round(Math.abs(pan) * 100);
  return pan < 0 ? `L${pct}` : `R${pct}`;
}

export function formatRatio(ratio: number): string {
  if (!isFinite(ratio)) return '∞:1';
  return Number.isInteger(ratio) ? `${ratio}:1` : `${ratio}:1`;
}

export function formatSend(send: number): string {
  if (send <= 0) return '-∞';
  return formatDb(faderToDb(send));
}

/** ASCII bar of given width. */
export function bar(normalized: number, width: number): string {
  const filled = Math.round(Math.max(0, Math.min(1, normalized)) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

/** Linear normalization to 0-1. */
export function linearNorm(v: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

/** Clamp a value to [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Format wall-clock time as [HH:MM:SS]. */
export function nowStr(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}
