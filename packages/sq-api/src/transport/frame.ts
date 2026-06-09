/**
 * A&H SQ framing — confirmed from live traffic capture.
 *
 * Wire frame format (6-byte header):
 *   [0x7F][subType:u8][length:u32LE][payload × length]
 *
 * DSP register frame format (fixed 8 bytes):
 *   [0xF7][ch:u8][ch:u8][register:u8][value:u32LE]
 *
 * ── Subtype reference ───────────────────────────────────────────
 *  0x00  MeterSub     UDP port exchange (app→mixer first, then mixer echoes)
 *  0x01  Ack          Empty ack from app after receiving mixer's 0x00
 *  0x02  Version      Mixer→app: 12-byte firmware/model info
 *  0x03  Keepalive    Empty, sent periodically by app
 *  0x04  ParamData    Mixer→app: large parameter value stream
 *  0x08  ChannelInfo  Mixer→app: channel names, scene info
 *  0x0A  Subscribe    App→mixer: 8192-byte subscription (request all state)
 *  0x0B  TypeReq      App→mixer: payload [02 00] — type negotiation
 *  0x0C  TypeResp     Mixer→app: payload [01 00]
 *  0x0D  SubExtra1    Empty, sent after subscription
 *  0x0E  FullState    Mixer→app: 8200-byte channel/parameter table
 *  0x0F  SubExtra3    Empty
 *  0x10  Block16      Mixer→app: 928 bytes (routing/config)
 *  0x11  SubExtra2    Empty
 *  0x12  Block18      Mixer→app: 32-byte block
 *  0x14  StateAck     Empty — sent after receiving 0x15
 *  0x15  InitState    Mixer→app: 720 bytes initial state
 *  0x1A  ParamWrite   App→mixer: 8-byte parameter write
 *  0x19  Sync         Mixer→app: empty, marks end of initial burst
 */

import { Buf } from "./buffer";

export const MARKER    = 0x7f;
export const DSP_MARKER = 0xf7;
export const HEADER_LEN = 6; // marker(1) + subtype(1) + length(4)

export const enum Sub {
  MeterSub   = 0x00,
  Ack        = 0x01,
  Version    = 0x02,
  Keepalive  = 0x03,
  ParamData  = 0x04,
  ChannelInfo= 0x08,
  Subscribe  = 0x0a,
  TypeReq    = 0x0b,
  TypeResp   = 0x0c,
  SubExtra1  = 0x0d,
  FullState  = 0x0e,
  SubExtra3  = 0x0f,
  Block16    = 0x10,
  SubExtra2  = 0x11,
  Block18    = 0x12,
  StateAck   = 0x14,
  InitState  = 0x15,
  ParamWrite = 0x1a,
  Sync       = 0x19,
}

export interface Frame {
  subType: number;
  payload: Buffer;
}

// ── Encoding ──────────────────────────────────────────────────────────────────

export function encodeFrame(subType: number, payload: Buffer): Buffer {
  const buf = new Buf(HEADER_LEN + payload.length);
  buf.writeU8(MARKER);
  buf.writeU8(subType);
  buf.writeU32LE(payload.length);
  buf.writeBytes(payload);
  return buf.toBuffer();
}

export function encodeEmpty(subType: number): Buffer {
  return encodeFrame(subType, Buffer.alloc(0));
}

/** Step 1 of handshake: tell mixer which UDP port we'll listen on for meters. */
export function encodeMeterSub(udpPort: number): Buffer {
  const p = new Buf(2);
  p.writeU16LE(udpPort);
  return encodeFrame(Sub.MeterSub, p.toBuffer());
}

export function encodeKeepalive():   Buffer { return encodeEmpty(Sub.Keepalive); }
export function encodeAck():         Buffer { return encodeEmpty(Sub.Ack); }
export function encodeStateAck():    Buffer { return encodeEmpty(Sub.StateAck); }
export function encodeSubExtra1():   Buffer { return encodeEmpty(Sub.SubExtra1); }
export function encodeSubExtra2():   Buffer { return encodeEmpty(Sub.SubExtra2); }
export function encodeSubExtra3():   Buffer { return encodeEmpty(Sub.SubExtra3); }

export function encodeTypeReq(): Buffer {
  return encodeFrame(Sub.TypeReq, Buffer.from([0x02, 0x00]));
}

/** Step 5: subscribe to all parameters using all-0xFF */
export function encodeSubscribeAll(): Buffer {
  // Force all-0xFF to request ParamData and everything
  return encodeFrame(Sub.Subscribe, Buffer.alloc(8192, 0xff));
}

// ── Framer ────────────────────────────────────────────────────────────────────

/** Stateful TCP stream framer — accumulates bytes, emits complete frames. */
export class Framer {
  private acc: Buffer = Buffer.alloc(0);

  push(chunk: Buffer): Frame[] {
    this.acc = Buffer.concat([this.acc, chunk]);
    const out: Frame[] = [];

    while (this.acc.length >= HEADER_LEN) {
      const marker = this.acc[0];

      if (marker === DSP_MARKER) {
        // Fixed 8-byte DSP frame
        if (this.acc.length < 8) break;
        const payload = Buffer.from(this.acc.slice(1, 8));
        out.push({ subType: DSP_MARKER, payload });
        this.acc = this.acc.slice(8);
        continue;
      }

      if (marker !== MARKER) {
        // Resync: find next 0x7F or 0xF7
        let next = -1;
        for (let i = 1; i < this.acc.length; i++) {
          if (this.acc[i] === MARKER || this.acc[i] === DSP_MARKER) { next = i; break; }
        }
        this.acc = next === -1 ? Buffer.alloc(0) : this.acc.slice(next);
        continue;
      }

      // 6-byte frame header
      const subType = this.acc[1];
      const len = this.acc.readUInt32LE(2);
      if (this.acc.length < HEADER_LEN + len) break;

      const payload = Buffer.from(this.acc.slice(HEADER_LEN, HEADER_LEN + len));
      out.push({ subType, payload });
      this.acc = this.acc.slice(HEADER_LEN + len);
    }

    return out;
  }

  reset(): void { this.acc = Buffer.alloc(0); }
}
