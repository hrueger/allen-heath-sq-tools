import { EventEmitter } from "node:events";
import { Connection } from "../transport/connection";
import * as conv from "./conversions";

export class Channel extends EventEmitter {
  readonly b3: number;
  protected _conn: Connection;

  /** Last known fader level in dB (−Infinity = off), null until first DSP update. */
  level: number | null = null;
  /** Last known mute state, null until first DSP update. */
  muted: boolean | null = null;
  /** Last known pan value (-1.0 = full left, 0 = center, +1.0 = full right), null until first DSP update. */
  pan: number | null = null;
  /** Last known gain in dB, null until first DSP update. */
  gain: number | null = null;
  /** Last known trim in dB, null until first DSP update. */
  trim: number | null = null;
  /** Send levels to buses (busNumber → dB, −Infinity = off). */
  sends: Map<number, number> = new Map();
  /** Send levels to FX Returns (fxNumber → dB, −Infinity = off). */
  fxSends: Map<number, number> = new Map();
  /** Last known HPF on/off state, null until first DSP update. */
  hpfOn: boolean | null = null;
  /** Last known HPF frequency in Hz, null until first DSP update. */
  hpfFreq: number | null = null;
  /** Last known HPF slope in dB/octave (12, 18, or 24), null until first DSP update. */
  hpfSlope: number | null = null;
  /** Last known Gate on/off state, null until first DSP update. */
  gateOn: boolean | null = null;
  /** Last known Gate threshold in dB, null until first DSP update. */
  gateThreshold: number | null = null;
  /** Last known Gate depth in dB, null until first DSP update. */
  gateDepth: number | null = null;
  /** Last known Gate attack time in milliseconds, null until first DSP update. */
  gateAttack: number | null = null;
  /** Last known Gate release time in milliseconds, null until first DSP update. */
  gateRelease: number | null = null;
  /** Last known Gate hold time in milliseconds, null until first DSP update. */
  gateHold: number | null = null;
  /** Last known Compressor on/off state, null until first DSP update. */
  compOn: boolean | null = null;
  /** Last known Compressor threshold in dB, null until first DSP update. */
  compThreshold: number | null = null;
  /** Last known Compressor ratio (e.g., 4 for 1:4), null until first DSP update. */
  compRatio: number | null = null;
  /** Last known Compressor makeup gain in dB, null until first DSP update. */
  compGain: number | null = null;
  /** Last known Pad on/off state, null until first DSP update. */
  padOn: boolean | null = null;
  /** Last known Phantom power (48V) on/off state, null until first DSP update. */
  phantomOn: boolean | null = null;
  /** Last known Polarity (phase flip) on/off state, null until first DSP update. */
  polarityOn: boolean | null = null;
  /** Last known Delay on/off state, null until first DSP update. */
  delayOn: boolean | null = null;
  /** Last known Delay duration in milliseconds, null until first DSP update. */
  delayDuration: number | null = null;
  /** Last known Direct Out assignment (1-3, null if unassigned), null until first DSP update. */
  directOut: number | null = null;
  /** Last known Insert enabled state, null until first DSP update. */
  insertEnabled: boolean | null = null;
  /** Last known PAFL (solo) state, null until first DSP update. */
  paflOn: boolean | null = null;
  /** Channel name as set on the console; defaults to the hardware label (e.g. "Ip1") until a name is received. */
  name: string;

  // PEQ global on/off
  peqOn: boolean | null = null;

  // PEQ Low Frequency band (has shape)
  peqLfGain: number | null = null;
  peqLfFreq: number | null = null;
  peqLfQ: number | null = null;
  peqLfShape: number | null = null;  // 0=Peak, 6=Low Shelf, 11=High Pass

  // PEQ Low Mid band (no shape)
  peqLmGain: number | null = null;
  peqLmFreq: number | null = null;
  peqLmQ: number | null = null;

  // PEQ High Mid band (no shape)
  peqHmGain: number | null = null;
  peqHmFreq: number | null = null;
  peqHmQ: number | null = null;

  // PEQ High Frequency band (has shape)
  peqHfGain: number | null = null;
  peqHfFreq: number | null = null;
  peqHfQ: number | null = null;
  peqHfShape: number | null = null;  // 0=Peak, 6=Low Shelf, 11=High Pass

  constructor(conn: Connection, b3: number, defaultName: string) {
    super();
    this._conn = conn;
    this.b3 = b3;
    this.name = defaultName;
  }

  setLevel(db: number): void {
    const wire = !isFinite(db) ? 0 : Math.max(0, Math.min(35328, Math.round(0x8000 + db * 256)));
    this._conn.send(Buffer.from([
      0xf7, 0x07, 0x07, 0x0e, this.b3, 0x20,
      wire & 0xff, (wire >> 8) & 0xff,
    ]));
    this.level = db;
    this.emit("level", db);
  }

  setMute(muted: boolean): void {
    const val = muted ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x07, 0x07, 0x0c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.muted = muted;
    this.emit("mute", muted);
  }

  setPan(value: number): void {
    const panValue = conv.pan.toWire(value);
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x07, 0x10, this.b3, 0x20,
      panValue & 0xff, (panValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.pan = conv.pan.fromWire(panValue);
    this.emit("pan", this.pan);
  }

  setGain(dB: number): void {
    const gainValue = conv.dB.toWire(conv.clamp(dB, 0, 60));
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x0c, 0x0c, this.b3, 0x01,
      gainValue & 0xff, (gainValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gain = dB;
    this.emit("gain", dB);
  }

  setTrim(dB: number): void {
    const trimValue = conv.dB.toWire(conv.clamp(dB, -24, 24));
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0c, 0x0f, this.b3, 0x00,
      trimValue & 0xff, (trimValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.trim = dB;
    this.emit("trim", dB);
  }

  setSend(busNumber: number, db: number): void {
    const busId = 0x10 + (busNumber - 1);
    const wire = !isFinite(db) ? 0 : Math.max(0, Math.min(35328, Math.round(0x8000 + db * 256)));
    this._conn.send(Buffer.from([
      0xf7, 0x09, 0x07, 0x0e, this.b3, busId,
      wire & 0xff, (wire >> 8) & 0xff,
    ]));
  }

  setSendFx(fxNumber: number, db: number): void {
    const fxId = 0x23 + (fxNumber - 1);
    const wire = !isFinite(db) ? 0 : Math.max(0, Math.min(35328, Math.round(0x8000 + db * 256)));
    this._conn.send(Buffer.from([
      0xf7, 0x09, 0x07, 0x0e, this.b3, fxId,
      wire & 0xff, (wire >> 8) & 0xff,
    ]));
  }

  setHpfOn(on: boolean): void {
    const val = on ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x0e, 0x0c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.hpfOn = on;
    this.emit("hpf-on", on);
  }

  setHpfFreq(hz: number): void {
    const hpfValue = conv.hpfFreq.toWire(hz);
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x0e, 0x0d, this.b3, 0x00,
      hpfValue & 0xff, (hpfValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.hpfFreq = hz;
    this.emit("hpf-freq", hz);
  }

  setHpfSlope(dbPerOctave: number): void {
    const slopeCode = conv.hpfSlope.toWire(dbPerOctave);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0e, 0x0e, this.b3, 0x00,
      slopeCode & 0xff, (slopeCode >> 8) & 0xff,
    ]));
    // Optimistic update
    this.hpfSlope = dbPerOctave;
    this.emit("hpf-slope", dbPerOctave);
  }

  setGateOn(on: boolean): void {
    const val = on ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x0f, 0x0c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gateOn = on;
    this.emit("gate-on", on);
  }

  setGateThreshold(dB: number): void {
    const thresholdValue = conv.dB.toWire(conv.clamp(dB, -128, 127));
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x0f, 0x0e, this.b3, 0x00,
      thresholdValue & 0xff, (thresholdValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gateThreshold = conv.clamp(dB, -128, 127);
    this.emit("gate-threshold", this.gateThreshold);
  }

  setGateDepth(dB: number): void {
    const depthValue = conv.dB.toWire(conv.clamp(dB, 0, 60));
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0f, 0x0f, this.b3, 0x00,
      depthValue & 0xff, (depthValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gateDepth = conv.clamp(dB, 0, 60);
    this.emit("gate-depth", this.gateDepth);
  }

  setGateAttack(ms: number): void {
    const attackValue = conv.timeMs.toWire(conv.clamp(ms, 0.05, 300));
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0f, 0x10, this.b3, 0x00,
      attackValue & 0xff, (attackValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gateAttack = conv.clamp(ms, 0.05, 300);
    this.emit("gate-attack", this.gateAttack);
  }

  setGateRelease(ms: number): void {
    const releaseValue = conv.timeMs.toWire(conv.clamp(ms, 10, 1000));
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0f, 0x11, this.b3, 0x00,
      releaseValue & 0xff, (releaseValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gateRelease = conv.clamp(ms, 10, 1000);
    this.emit("gate-release", this.gateRelease);
  }

  setGateHold(ms: number): void {
    const holdValue = conv.timeMs.toWire(conv.clamp(ms, 10, 5000));
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0f, 0x12, this.b3, 0x00,
      holdValue & 0xff, (holdValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.gateHold = conv.clamp(ms, 10, 5000);
    this.emit("gate-hold", this.gateHold);
  }

  setCompOn(on: boolean): void {
    const val = on ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x13, 0x0c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.compOn = on;
    this.emit("comp-on", on);
  }

  setCompThreshold(dB: number): void {
    const clamped = conv.clamp(dB, -46, 18);
    const thresholdValue = conv.compThreshold.toWire(clamped);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x13, 0x0e, this.b3, 0x00,
      thresholdValue & 0xff, (thresholdValue >> 8) & 0xff,
    ]));
    this.compThreshold = clamped;
    this.emit("comp-threshold", clamped);
  }

  setCompRatio(ratio: number): void {
    const ratioCode = conv.compRatio.toWire(ratio);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x13, 0x0f, this.b3, 0x00,
      ratioCode & 0xff, (ratioCode >> 8) & 0xff,
    ]));
    // Optimistic update
    this.compRatio = ratio;
    this.emit("comp-ratio", ratio);
  }

  setCompGain(dB: number): void {
    const clamped = conv.clamp(dB, 0, 18);
    const gainValue = conv.compGain.toWire(clamped);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x13, 0x10, this.b3, 0x00,
      gainValue & 0xff, (gainValue >> 8) & 0xff,
    ]));
    this.compGain = clamped;
    this.emit("comp-gain", clamped);
  }

  setPadOn(on: boolean): void {
    const padValue = conv.padOnOff.toWire(on);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0c, 0x0e, this.b3, 0x01,
      padValue & 0xff, (padValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.padOn = on;
    this.emit("pad-on", on);
  }

  setPhantomOn(on: boolean): void {
    const phantomValue = conv.padOnOff.toWire(on);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0c, 0x0d, this.b3, 0x01,
      phantomValue & 0xff, (phantomValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.phantomOn = on;
    this.emit("phantom-on", on);
  }

  setPolarityOn(on: boolean): void {
    const polarityValue = conv.padOnOff.toWire(on);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x0c, 0x10, this.b3, 0x00,
      polarityValue & 0xff, (polarityValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.polarityOn = on;
    this.emit("polarity-on", on);
  }

  setDelayOn(on: boolean): void {
    const delayValue = conv.padOnOff.toWire(on);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x14, 0x0c, this.b3, 0x00,
      delayValue & 0xff, (delayValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.delayOn = on;
    this.emit("delay-on", on);
  }

  setDelayDuration(ms: number): void {
    const durationValue = conv.delayMs.toWire(ms);
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x14, 0x0d, this.b3, 0x00,
      durationValue & 0xff, (durationValue >> 8) & 0xff,
    ]));
    // Optimistic update
    this.delayDuration = ms;
    this.emit("delay-duration", ms);
  }

  setDirectOut(outNumber: number | null): void {
    if (outNumber === null || outNumber === 0) {
      this._conn.send(Buffer.from([
        0xf7, 0x0b, 0x0b, 0x0c, this.b3, 0x00, 0x00, 0x1a,
      ]));
      this.directOut = 0;
    } else {
      const doNum = Math.max(0, Math.min(2, outNumber - 1));
      this._conn.send(Buffer.from([
        0xf7, 0x0b, 0x0b, 0x0d, this.b3, 0x0f, doNum, 0x1a,
      ]));
      this.directOut = outNumber;
    }
    this.emit("direct-out", this.directOut);
  }

  setInsertEnabled(enabled: boolean): void {
    const val = enabled ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x10, 0x0c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.insertEnabled = enabled;
    this.emit("insert-enabled", enabled);
  }

  setPaflOn(on: boolean): void {
    const val = on ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x08, 0x15, 0x0c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.paflOn = on;
    this.emit("pafl-on", on);
  }

  private _setPeqParam(band: number, register: number, value: number): void {
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x11, register, this.b3, 0x00,
      value & 0xff, (value >> 8) & 0xff,
    ]));
  }

  setPeqOn(on: boolean): void {
    const val = on ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x38, 0x11, 0x1a, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
    // Optimistic update
    this.peqOn = on;
    this.emit("peq-on", on);
  }

  setPeqLfGain(dB: number): void {
    const clamped = conv.clamp(dB, -15, 15);
    this._setPeqParam(0, 0x0c, conv.compThreshold.toWire(clamped));
    this.peqLfGain = clamped;
    this.emit("peq-lf-gain", clamped);
  }

  setPeqLfFreq(hz: number): void {
    const wireVal = Math.round(-9206 + 15308 * Math.log10(hz));
    this._setPeqParam(0, 0x0d, wireVal);
    this.peqLfFreq = hz;
    this.emit("peq-lf-freq", hz);
  }

  setPeqLfQ(q: number): void {
    const wireVal = Math.round(q * 8);
    this._setPeqParam(0, 0x0e, wireVal);
    this.peqLfQ = q;
    this.emit("peq-lf-q", q);
  }

  setPeqLfShape(shape: number): void {
    this._setPeqParam(0, 0x0f, shape);
    this.peqLfShape = shape;
    this.emit("peq-lf-shape", shape);
  }

  setPeqLmGain(dB: number): void {
    const clamped = conv.clamp(dB, -15, 15);
    this._setPeqParam(1, 0x10, conv.compThreshold.toWire(clamped));
    this.peqLmGain = clamped;
    this.emit("peq-lm-gain", clamped);
  }

  setPeqLmFreq(hz: number): void {
    const wireVal = Math.round(-9206 + 15308 * Math.log10(hz));
    this._setPeqParam(1, 0x11, wireVal);
    this.peqLmFreq = hz;
    this.emit("peq-lm-freq", hz);
  }

  setPeqLmQ(q: number): void {
    const wireVal = Math.round(q * 8);
    this._setPeqParam(1, 0x12, wireVal);
    this.peqLmQ = q;
    this.emit("peq-lm-q", q);
  }

  setPeqHmGain(dB: number): void {
    const clamped = conv.clamp(dB, -15, 15);
    this._setPeqParam(2, 0x13, conv.compThreshold.toWire(clamped));
    this.peqHmGain = clamped;
    this.emit("peq-hm-gain", clamped);
  }

  setPeqHmFreq(hz: number): void {
    const wireVal = Math.round(-9206 + 15308 * Math.log10(hz));
    this._setPeqParam(2, 0x14, wireVal);
    this.peqHmFreq = hz;
    this.emit("peq-hm-freq", hz);
  }

  setPeqHmQ(q: number): void {
    const wireVal = Math.round(q * 8);
    this._setPeqParam(2, 0x15, wireVal);
    this.peqHmQ = q;
    this.emit("peq-hm-q", q);
  }

  setPeqHfGain(dB: number): void {
    const clamped = conv.clamp(dB, -15, 15);
    this._setPeqParam(3, 0x16, conv.compThreshold.toWire(clamped));
    this.peqHfGain = clamped;
    this.emit("peq-hf-gain", clamped);
  }

  setPeqHfFreq(hz: number): void {
    const wireVal = Math.round(-9206 + 15308 * Math.log10(hz));
    this._setPeqParam(3, 0x17, wireVal);
    this.peqHfFreq = hz;
    this.emit("peq-hf-freq", hz);
  }

  setPeqHfQ(q: number): void {
    const wireVal = Math.round(q * 8);
    this._setPeqParam(3, 0x18, wireVal);
    this.peqHfQ = q;
    this.emit("peq-hf-q", q);
  }

  setPeqHfShape(shape: number): void {
    this._setPeqParam(3, 0x19, shape);
    this.peqHfShape = shape;
    this.emit("peq-hf-shape", shape);
  }

  _onName(name: string): void {
    this.name = name;
    this.emit("name", name);
  }

  setName(name: string): void {
    const truncated = name.substring(0, 6);
    const payload = Buffer.alloc(14);
    payload[0] = 0x18;
    payload[1] = 0x18;
    payload[4] = this.b3;  // channel address at [4]
    payload.write(truncated, 7, 'ascii');

    // Send first frame with message type 0x0c
    const payload1 = Buffer.from(payload);
    payload1[2] = 0x0c;
    const frame1 = Buffer.concat([
      Buffer.from([0x7f, 0x08, 0x0e, 0x00, 0x00, 0x00]),
      payload1,
    ]);
    this._conn.send(frame1);

    // Send second frame with message type 0x07
    const payload2 = Buffer.from(payload);
    payload2[2] = 0x07;
    const frame2 = Buffer.concat([
      Buffer.from([0x7f, 0x08, 0x0e, 0x00, 0x00, 0x00]),
      payload2,
    ]);
    this._conn.send(frame2);
  }

  setColor(r: number, g: number, b: number): void {
    const payload = Buffer.alloc(15);
    payload[0] = 0x18;
    payload[1] = 0x18;
    payload[2] = 0x0d;
    payload[4] = this.b3;  // channel address at [4]
    payload[7] = Math.max(0, Math.min(255, r));
    payload[8] = Math.max(0, Math.min(255, g));
    payload[9] = Math.max(0, Math.min(255, b));
    payload[11] = 0x01;    // flag: custom color

    const frame = Buffer.concat([
      Buffer.from([0x7f, 0x08, 0x0f, 0x00, 0x00, 0x00]),
      payload,
    ]);
    this._conn.send(frame);
  }

  setColorTransparent(): void {
    const payload = Buffer.alloc(15);
    payload[0] = 0x18;
    payload[1] = 0x18;
    payload[2] = 0x0d;
    payload[4] = this.b3;  // channel address at [4]

    const frame = Buffer.concat([
      Buffer.from([0x7f, 0x08, 0x0f, 0x00, 0x00, 0x00]),
      payload,
    ]);
    this._conn.send(frame);
  }

  /** Called by SQMixer when a DSP frame arrives for this channel's b3 address. */
  _onDsp(register: number, value: number, category?: number, modifier?: number): void {
    if (register === 0x0e && modifier === 0x20) {
      this.level = value <= 0 ? -Infinity : (value - 0x8000) / 256;
      this.emit("level", this.level);
    } else if (register === 0x0e && modifier !== undefined && modifier >= 0x10 && modifier <= 0x1b) {
      const busNumber = modifier - 0x10 + 1;
      const db = value <= 0 ? -Infinity : (value - 0x8000) / 256;
      this.sends.set(busNumber, db);
      this.emit("send", busNumber, db);
    } else if (register === 0x0e && modifier !== undefined && modifier >= 0x23 && modifier <= 0x26) {
      const fxNumber = modifier - 0x23 + 1;
      const db = value <= 0 ? -Infinity : (value - 0x8000) / 256;
      this.fxSends.set(fxNumber, db);
      this.emit("send-fx", fxNumber, db);
    } else if (register === 0x0c && category === 0x07) {
      this.muted = value !== 0;
      this.emit("mute", this.muted);
    } else if (register === 0x0c && category === 0x0c) {
      this.gain = conv.dB.fromWire(value);
      this.emit("gain", this.gain);
    } else if (register === 0x0f && category === 0x0c) {
      this.trim = conv.dB.fromWire(value);
      this.emit("trim", this.trim);
    } else if (register === 0x0c && category === 0x0e) {
      this.hpfOn = value !== 0;
      this.emit("hpf-on", this.hpfOn);
    } else if (register === 0x0d && category === 0x0e) {
      this.hpfFreq = Math.pow(10, (value + 9206) / 15308);
      this.emit("hpf-freq", this.hpfFreq);
    } else if (register === 0x0e && category === 0x0e) {
      const slopeMap = { 1: 12, 2: 18, 3: 24 };
      this.hpfSlope = slopeMap[value as keyof typeof slopeMap] || 12;
      this.emit("hpf-slope", this.hpfSlope);
    } else if (register === 0x0c && category === 0x0f) {
      this.gateOn = value !== 0;
      this.emit("gate-on", this.gateOn);
    } else if (register === 0x0e && category === 0x0f) {
      this.gateThreshold = conv.dB.fromWire(value);
      this.emit("gate-threshold", this.gateThreshold);
    } else if (register === 0x0f && category === 0x0f) {
      this.gateDepth = conv.dB.fromWire(value);
      this.emit("gate-depth", this.gateDepth);
    } else if (register === 0x10 && category === 0x0f) {
      this.gateAttack = conv.timeMs.fromWire(value);
      this.emit("gate-attack", this.gateAttack);
    } else if (register === 0x11 && category === 0x0f) {
      this.gateRelease = conv.timeMs.fromWire(value);
      this.emit("gate-release", this.gateRelease);
    } else if (register === 0x12 && category === 0x0f) {
      this.gateHold = conv.timeMs.fromWire(value);
      this.emit("gate-hold", this.gateHold);
    } else if (register === 0x0c && category === 0x13) {
      this.compOn = value !== 0;
      this.emit("comp-on", this.compOn);
    } else if (register === 0x0e && category === 0x13) {
      this.compThreshold = conv.compThreshold.fromWire(value);
      this.emit("comp-threshold", this.compThreshold);
    } else if (register === 0x0f && category === 0x13) {
      this.compRatio = conv.compRatio.fromWire(value);
      this.emit("comp-ratio", this.compRatio);
    } else if (register === 0x10 && category === 0x13) {
      this.compGain = conv.compGain.fromWire(value);
      this.emit("comp-gain", this.compGain);
    } else if (register === 0x0e && category === 0x0c && modifier === 0x01) {
      this.padOn = conv.padOnOff.fromWire(value);
      this.emit("pad-on", this.padOn);
    } else if (register === 0x0d && category === 0x0c && modifier === 0x01) {
      this.phantomOn = conv.padOnOff.fromWire(value);
      this.emit("phantom-on", this.phantomOn);
    } else if (register === 0x10 && category === 0x0c && modifier === 0x00) {
      this.polarityOn = conv.padOnOff.fromWire(value);
      this.emit("polarity-on", this.polarityOn);
    } else if (register === 0x10) {
      this.pan = conv.pan.fromWire(value);
      this.emit("pan", this.pan);
    } else if (register === 0x0c && category === 0x14) {
      this.delayOn = conv.padOnOff.fromWire(value);
      this.emit("delay-on", this.delayOn);
    } else if (register === 0x0d && category === 0x14) {
      this.delayDuration = conv.delayMs.fromWire(value);
      this.emit("delay-duration", this.delayDuration);
    } else if (register === 0x0c && category === 0x0b && modifier === 0x00) {
      const doNum = value & 0xff;
      this.directOut = doNum === 0 ? null : doNum + 1;
      this.emit("direct-out", this.directOut);
    } else if (register === 0x0c && category === 0x10) {
      this.insertEnabled = value !== 0;
      this.emit("insert-enabled", this.insertEnabled);
    } else if (register === 0x0c && category === 0x08) {
      this.paflOn = value !== 0;
      this.emit("pafl-on", this.paflOn);
    }
    // PEQ handlers (category 0x38, subcategory 0x11)
    else if (category === 0x38) {
      switch (register) {
        case 0x1a:
          this.peqOn = value !== 0;
          this.emit("peq-on", this.peqOn);
          break;
        // LF band (0x0c-0x0f)
        case 0x0c:
          this.peqLfGain = conv.compThreshold.fromWire(value);
          this.emit("peq-lf-gain", this.peqLfGain);
          break;
        case 0x0d:
          this.peqLfFreq = Math.pow(10, (value + 9206) / 15308);
          this.emit("peq-lf-freq", this.peqLfFreq);
          break;
        case 0x0e:
          this.peqLfQ = value / 8;
          this.emit("peq-lf-q", this.peqLfQ);
          break;
        case 0x0f:
          this.peqLfShape = value;
          this.emit("peq-lf-shape", this.peqLfShape);
          break;
        // LM band (0x10-0x12, no shape)
        case 0x10:
          this.peqLmGain = conv.compThreshold.fromWire(value);
          this.emit("peq-lm-gain", this.peqLmGain);
          break;
        case 0x11:
          this.peqLmFreq = Math.pow(10, (value + 9206) / 15308);
          this.emit("peq-lm-freq", this.peqLmFreq);
          break;
        case 0x12:
          this.peqLmQ = value / 8;
          this.emit("peq-lm-q", this.peqLmQ);
          break;
        // HM band (0x13-0x15, no shape)
        case 0x13:
          this.peqHmGain = conv.compThreshold.fromWire(value);
          this.emit("peq-hm-gain", this.peqHmGain);
          break;
        case 0x14:
          this.peqHmFreq = Math.pow(10, (value + 9206) / 15308);
          this.emit("peq-hm-freq", this.peqHmFreq);
          break;
        case 0x15:
          this.peqHmQ = value / 8;
          this.emit("peq-hm-q", this.peqHmQ);
          break;
        // HF band (0x16-0x19)
        case 0x16:
          this.peqHfGain = conv.compThreshold.fromWire(value);
          this.emit("peq-hf-gain", this.peqHfGain);
          break;
        case 0x17:
          this.peqHfFreq = Math.pow(10, (value + 9206) / 15308);
          this.emit("peq-hf-freq", this.peqHfFreq);
          break;
        case 0x18:
          this.peqHfQ = value / 8;
          this.emit("peq-hf-q", this.peqHfQ);
          break;
        case 0x19:
          this.peqHfShape = value;
          this.emit("peq-hf-shape", this.peqHfShape);
          break;
      }
    }
  }
}

export class InputChannel extends Channel {}
export class StereoInput extends Channel {}
export class FxReturn extends Channel {}
export class MixBus extends Channel {}

export class DcaGroup extends Channel {
  override setLevel(db: number): void {
    const wire = !isFinite(db) ? 0 : Math.max(0, Math.min(35328, Math.round(0x8000 + db * 256)));
    this._conn.send(Buffer.from([
      0xf7, 0x07, 0x07, 0x1e, this.b3, 0x00,
      wire & 0xff, (wire >> 8) & 0xff,
    ]));
  }

  override setMute(muted: boolean): void {
    const val = muted ? 0x0001 : 0x0000;
    this._conn.send(Buffer.from([
      0xf7, 0x07, 0x07, 0x1c, this.b3, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
  }

  override _onDsp(register: number, value: number, category?: number, modifier?: number): void {
    if (register === 0x1e) {
      this.level = value <= 0 ? -Infinity : (value - 0x8000) / 256;
      this.emit("level", this.level);
    } else if (register === 0x1c) {
      this.muted = value !== 0;
      this.emit("mute", this.muted);
    }
  }
}

export class MainLR extends Channel {}
