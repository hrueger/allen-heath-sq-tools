/**
 * Wire format conversion utilities.
 * These functions handle encoding/decoding between user-friendly values
 * and the binary wire formats used by the A&H SQ mixer.
 */

// ============================================================================
// dB-based parameters (256 units per dB, 0x8000 = 0dB reference)
// Used for: fader level, input gain, trim, gate threshold, gate depth, etc.
// ============================================================================

export const dB = {
  /** Encode dB value to 16-bit wire value. */
  toWire(dB: number): number {
    return Math.round(0x8000 + dB * 256);
  },

  /** Decode 16-bit wire value to dB. */
  fromWire(wire: number): number {
    return (wire - 0x8000) / 256;
  },
};

// ============================================================================
// Pan (stereo position)
// -1.0 = full left, 0 = center, +1.0 = full right
// ============================================================================

export const pan = {
  /** Encode pan value (-1 to +1) to wire format. */
  toWire(value: number): number {
    const clamped = Math.max(-1, Math.min(1, value));
    return Math.round(37 * (1 + clamped));
  },

  /** Decode wire value to pan (-1 to +1). */
  fromWire(wire: number): number {
    return wire / 37 - 1;
  },
};

// ============================================================================
// Send levels (0 to 1, mapped to 0-35328 range)
// ============================================================================

export const sendLevel = {
  /** Encode send level (0-1) to wire format. */
  toWire(value: number): number {
    const clamped = Math.max(0, Math.min(1, value));
    return Math.round(clamped * 35328);
  },

  /** Decode wire value to send level (0-1). */
  fromWire(wire: number): number {
    return wire / 35328;
  },
};

// ============================================================================
// Time parameters (exponential encoding)
// Used for: gate attack, gate release, gate hold, etc.
// Formula: wire = A * ln(ms) + B where A=2604.3, B=17917
// Inverse: ms = C * exp(D * wire) where C=0.001029, D=0.0003843
// ============================================================================

export const timeMs = {
  /** Encode time in milliseconds to wire format using exponential curve. */
  toWire(ms: number): number {
    const clamped = Math.max(0.001, Math.min(32767 / 109.23, ms)); // safe bounds
    return Math.round(2604.3 * Math.log(clamped) + 17917);
  },

  /** Decode wire value to time in milliseconds using exponential curve. */
  fromWire(wire: number): number {
    return 0.001029 * Math.exp(wire * 0.0003843);
  },
};

// ============================================================================
// HPF frequency (logarithmic, 20Hz-2kHz range)
// Formula: wire = -9206 + 15308 * log₁₀(Hz)
// ============================================================================

export const hpfFreq = {
  /** Encode HPF frequency in Hz to wire format. */
  toWire(hz: number): number {
    const clamped = Math.max(20, Math.min(2000, hz));
    return Math.round(-9206 + 15308 * Math.log10(clamped));
  },

  /** Decode wire value to HPF frequency in Hz. */
  fromWire(wire: number): number {
    return Math.pow(10, (wire + 9206) / 15308);
  },
};

// ============================================================================
// HPF slope (discrete values: 12, 18, or 24 dB/octave)
// ============================================================================

export const hpfSlope = {
  /** Encode HPF slope in dB/octave to wire code (1, 2, or 3). */
  toWire(dbPerOctave: number): number {
    if (dbPerOctave >= 24) return 3;
    if (dbPerOctave >= 18) return 2;
    return 1;
  },

  /** Decode wire code to HPF slope in dB/octave. */
  fromWire(code: number): number {
    const slopeMap: Record<number, number> = { 1: 12, 2: 18, 3: 24 };
    return slopeMap[code] || 12;
  },
};

// ============================================================================
// Compressor threshold (range: -46dB to +18dB, ~56 values per dB)
// ============================================================================

export const compThreshold = {
  /** Encode compressor threshold in dB to wire format. */
  toWire(dB: number): number {
    const clamped = clamp(dB, -46, 18);
    return Math.round(33751 + (clamped + 46) * 56.1875);
  },

  /** Decode wire value to compressor threshold in dB. */
  fromWire(wire: number): number {
    return -46 + (wire - 33751) / 56.1875;
  },
};

// ============================================================================
// Compressor ratio (discrete: 1:1 to ∞, mapped via lookup table)
// Wire values: 39→1:1, 38→1:1.5, 36→1:2, 35→1:2.5, etc.
// ============================================================================

const COMP_RATIO_MAP = [
  [39, 1], [38, 1.5], [36, 2], [35, 2.5], [33, 3], [32, 4], [30, 5], [29, 6],
  [27, 8], [26, 10], [24, 12], [22, 14], [20, 16], [19, 20], [18, 24], [17, 32],
  [14, 64], [13, 128], [12, 256], [11, Infinity],
] as const;

export const compRatio = {
  /** Encode compressor ratio (e.g., 4 for 1:4) to wire code. */
  toWire(ratio: number): number {
    if (ratio === Infinity) return 11;
    let bestWire = 39;
    let bestDiff = Math.abs(1 - ratio);
    for (const [wire, r] of COMP_RATIO_MAP) {
      const diff = Math.abs(r - ratio);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestWire = wire;
      }
    }
    return bestWire;
  },

  /** Decode wire code to compressor ratio. */
  fromWire(wire: number): number {
    for (const [w, r] of COMP_RATIO_MAP) {
      if (w === wire) return r;
    }
    return 1; // default fallback
  },
};

// ============================================================================
// Compressor makeup gain (range: 0 to 18dB, ~181 values per dB)
// ============================================================================

export const compGain = {
  /** Encode compressor makeup gain in dB to wire format. */
  toWire(dB: number): number {
    const clamped = clamp(dB, 0, 18);
    return Math.round(33536 + clamped * 181.333);
  },

  /** Decode wire value to compressor makeup gain in dB. */
  fromWire(wire: number): number {
    return (wire - 33536) / 181.333;
  },
};

// ============================================================================
// Pad on/off (simple boolean)
// ============================================================================

export const padOnOff = {
  /** Encode pad state (on/off) to wire value. */
  toWire(on: boolean): number {
    return on ? 0x0001 : 0x0000;
  },

  /** Decode wire value to pad state. */
  fromWire(wire: number): boolean {
    return wire !== 0;
  },
};

// ============================================================================
// Delay duration (0ms–341ms, ~3.02 units per ms, range 5–1035)
// ============================================================================

export const delayMs = {
  /** Encode delay duration in milliseconds to wire format. */
  toWire(ms: number): number {
    const clamped = clamp(ms, 0, 341);
    return Math.round(5 + (clamped * 1030) / 341);
  },

  /** Decode wire value to delay duration in milliseconds. */
  fromWire(wire: number): number {
    return ((wire - 5) * 341) / 1030;
  },
};

// ============================================================================
// Scene crossfade time (0–20s, ~310 units per second, range 200–6400)
// ============================================================================

export const sceneCrossfadeSeconds = {
  /** Encode crossfade time in seconds to wire format. */
  toWire(seconds: number): number {
    const clamped = clamp(seconds, 0, 20);
    return Math.round(200 + clamped * 310);
  },

  /** Decode wire value to crossfade time in seconds. */
  fromWire(wire: number): number {
    return (wire - 200) / 310;
  },
};

// ============================================================================
// Utility helpers
// ============================================================================

// ============================================================================
// Direct Out Level (-Infinity to +10dB, special handling for mute)
// ============================================================================

export const directOutLevel = {
  /** Encode Direct Out level in dB to wire format. */
  toWire(dB: number | null): number {
    if (dB === null || dB === -Infinity) return 0x0000;
    const clamped = clamp(dB, -128, 10);
    return Math.round(0x8000 + clamped * 256);
  },

  /** Decode wire value to Direct Out level in dB (null for -Infinity/mute). */
  fromWire(wire: number): number | null {
    if (wire === 0) return null;
    return (wire - 0x8000) / 256;
  },
};

// ============================================================================
// Channel Color (preset color palette: RGB tuples)
// ============================================================================

export enum ChannelColor {
  Black = 0x000000,
  Red = 0xff0000,
  Green = 0x00ff00,
  Blue = 0x0000ff,
  Turquoise = 0x00ffff,
  Yellow = 0xffff00,
  Pink = 0xff00ff,
  White = 0xffffff,
}

// ============================================================================
// Direct Out Tap Point (enum for signal chain insertion point)
// ============================================================================

export enum DirectOutTapPoint {
  PostPreamp = 0,
  PostHPF = 1,
  PostGate = 2,
  PostInsertReturns = 3,
  PostPEQ = 4,
  PostCompressor = 5,
  PostDelay = 6,
}

// ============================================================================
// Utility helpers
// ============================================================================

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
