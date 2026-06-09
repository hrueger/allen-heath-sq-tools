/**
 * A&H SQ TCP connection — proprietary binary protocol on port 51326.
 *
 * Handshake sequence (empirically determined from pcap of SQ MixPad):
 *
 *   1. App → [sub=0x00, len=2, payload=udpPort_LE16]   ← "meter me on this UDP port"
 *   2. Mixer → [sub=0x00, len=2, payload=mixerPort_LE16]  ← mixer's meter source port
 *   3. App → [sub=0x01, len=0]                          ← ack
 *   4. Mixer → [sub=0x02, len=12, payload=version_info] ← firmware version
 *   5. App → [sub=0x14, len=0]                          ← state-ack
 *   6. Mixer → [sub=0x15, len=720, payload=...]         ← initial state block
 *   7. App → [sub=0x0B, len=2, payload=[02,00]]         ← type negotiation
 *   8. Mixer → [sub=0x0C, len=2, payload=[01,00]]       ← type response
 *   9. App → [sub=0x0A, len=8192, payload=all_FF]       ← subscribe all parameters
 *  10. App → [sub=0x0D/0x11/0x0F, len=0]               ← extra subscriptions
 *  11. Mixer → floods parameter data (sub=0x04, 0x08, 0x0E, etc.)
 *  12. App → [sub=0x03] keepalive every ~1000ms
 */

import * as net from "net";
import * as dgram from "dgram";
import { EventEmitter } from "events";
import {
  Framer, Frame, Sub, DSP_MARKER,
  encodeMeterSub, encodeAck, encodeKeepalive, encodeStateAck,
  encodeTypeReq, encodeSubscribeAll,
  encodeSubExtra1, encodeSubExtra2, encodeSubExtra3,
} from "./frame";
import { Buf } from "./buffer";

export const SQ_TCP_PORT = 51326;
export const DISCOVERY_UDP_PORT = 51320;
export const KEEPALIVE_INTERVAL_MS = 1000;

export interface ConnectOptions {
  host: string;
  port?: number;
  /** Bind TCP to this local IP (e.g. "10.22.1.230" to force wired interface). */
  localInterface?: string;
  connectTimeoutMs?: number;
}

export interface VersionInfo {
  model:  number;
  fwA:    number;
  fwB:    number;
  build?: number;
}

export interface DspFrame {
  ch:       number;
  category: number;
  register: number;
  modifier: number;
  value:    number;
}

export class Connection extends EventEmitter {
  private tcp: net.Socket | null = null;
  private udp: dgram.Socket | null = null;
  private framer = new Framer();
  private kaTimer: NodeJS.Timeout | null = null;
  private _connected = false;
  private opts: Required<ConnectOptions>;

  version: VersionInfo | null = null;
  mixerMeterPort = 0;

  constructor(opts: ConnectOptions) {
    super();
    this.opts = {
      host:             opts.host,
      port:             opts.port ?? SQ_TCP_PORT,
      localInterface:   opts.localInterface ?? "",
      connectTimeoutMs: opts.connectTimeoutMs ?? 10000,
    };
  }

  get connected(): boolean { return this._connected; }

  get localUdpPort(): number {
    const a = this.udp?.address() as { port?: number } | null;
    return a?.port ?? 0;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const udp = dgram.createSocket("udp4");
      this.udp = udp;
      udp.on("error", (e) => this.emit("error", e));
      udp.on("message", (msg, rinfo) => this.emit("meterData", msg, rinfo.address));

      udp.bind(0, () => {
        this._openTcp(resolve, reject);
      });
    });
  }

  private _openTcp(resolve: () => void, reject: (e: Error) => void): void {
    const tcpOpts: net.TcpNetConnectOpts = {
      host: this.opts.host,
      port: this.opts.port,
    };
    if (this.opts.localInterface) tcpOpts.localAddress = this.opts.localInterface;

    const tcp = new net.Socket();
    tcp.setNoDelay(true);
    this.tcp = tcp;
    this.framer.reset();

    const timeout = setTimeout(() => {
      tcp.destroy();
      reject(new Error(`Handshake timeout after ${this.opts.connectTimeoutMs}ms`));
    }, this.opts.connectTimeoutMs);

    // Handshake state machine
    let step = 0;

    const onFrame = (frame: Frame) => {
      this.emit("frame", frame);

      if (frame.subType === DSP_MARKER) {
        if (frame.payload.length >= 7) {
          const d: DspFrame = {
            ch:       frame.payload[3],
            category: frame.payload[1],
            register: frame.payload[2],
            modifier: frame.payload[4],
            value:    frame.payload.readUInt16LE(5),
          };
          this.emit("dsp", d);
        }
        return;
      }

      switch (step) {
        case 0:
          // Waiting for mixer's sub=0x00 (meter port)
          if (frame.subType === Sub.MeterSub && frame.payload.length >= 2) {
            this.mixerMeterPort = frame.payload.readUInt16LE(0);
            step = 1;
            tcp.write(encodeAck());
          }
          break;

        case 1:
          // Waiting for sub=0x02 (version)
          if (frame.subType === Sub.Version && frame.payload.length >= 4) {
            const b = new Buf(frame.payload);
            this.version = {
              model: b.readU8(),
              fwA:   b.readU8(),
              fwB:   b.readU8(),
              build: frame.payload.length >= 6 ? frame.payload.readUInt16LE(4) : undefined,
            };
            step = 2;
            // App sends StateAck AFTER version, BEFORE InitState
            tcp.write(encodeStateAck());
          }
          break;

        case 2:
          // Waiting for sub=0x15 (initial state from mixer)
          if (frame.subType === Sub.InitState) {
            step = 3;
            tcp.write(encodeTypeReq());
          }
          break;

        case 3:
          // Waiting for sub=0x0C (type response)
          if (frame.subType === Sub.TypeResp) {
            step = 4;
            tcp.write(encodeSubscribeAll());
            setTimeout(() => tcp.write(encodeSubExtra1()), 40);
            setTimeout(() => tcp.write(encodeSubExtra2()), 80);
            setTimeout(() => tcp.write(encodeSubExtra3()), 120);
            // DSP read request: triggers the mixer to send the scene-list ChannelInfo.
            // MixPad sends f7 02 02 20 ff ff ff ff ~40ms after receiving Block16
            // (which arrives 1ms after SubExtra3). ch1=ch2=0x02 = scene category,
            // reg=0x20, val=0xffffffff means "send full dump".
            setTimeout(() => tcp.write(Buffer.from([0xf7, 0x02, 0x02, 0x20, 0xff, 0xff, 0xff, 0xff])), 160);
            // Mark connected
            clearTimeout(timeout);
            this._connected = true;
            this._startKeepalive();
            tcp.off("data", handleData);
            tcp.on("data", (c: Buffer) => {
              for (const f of this.framer.push(c)) this._dispatch(f);
            });
            resolve();
            this.emit("connect", this.version);
          }
          break;
      }
    };

    const handleData = (chunk: Buffer) => {
      for (const f of this.framer.push(chunk)) onFrame(f);
    };

    tcp.connect(tcpOpts, () => {
      // Step 1: send our meter subscription with local UDP port
      tcp.write(encodeMeterSub(this.localUdpPort));
      tcp.on("data", handleData);
    });

    tcp.on("close", (hadError) => {
      this._connected = false;
      this._stopKeepalive();
      this.emit("disconnect", hadError);
    });

    tcp.on("error", (err) => {
      clearTimeout(timeout);
      this._connected = false;
      this._stopKeepalive();
      if (!this._connected) reject(err);
      else this.emit("error", err);
    });
  }

  /** Send a raw frame to the mixer. */
  send(frame: Buffer): void {
    if (!this.tcp || !this._connected) throw new Error("Not connected");
    this.tcp.write(frame);
  }

  disconnect(): void {
    this._stopKeepalive();
    this._connected = false;
    this.tcp?.destroy();
    this.tcp = null;
    this.udp?.close();
    this.udp = null;
  }

  private _initialStateParsed = false;

  private _dispatch(frame: Frame): void {
    this.emit("frame", frame);

    if (frame.subType === DSP_MARKER) {
      if (frame.payload.length >= 7) {
        const d: DspFrame = {
          ch:       frame.payload[3],
          category: frame.payload[1],
          register: frame.payload[2],
          modifier: frame.payload[4],
          value:    frame.payload.readUInt16LE(5),
        };
        this.emit("dsp", d);
      }
      return;
    }

    if (frame.subType === Sub.ParamData) {
      this.emit("paramData", frame.payload);
      if (!this._initialStateParsed && frame.payload.length === 97376) {
        this._initialStateParsed = true;
        this._parseInitialState(frame.payload);
      }
    }

    // ChannelInfo frames containing scene data
    if (frame.subType === Sub.ChannelInfo && frame.payload.length > 20) {
      this._parseChannelInfo(frame.payload);
    }
  }

  private _parseChannelInfo(payload: Buffer): void {
    // Scene-list format: header 02 02 xx 00 00 00 00, 18-byte records follow.
    // Sent proactively on initial connect (after subscription) for all scene slots.
    // Record layout: [flag:1][name:16 null-padded][reserved:1]
    // flag=0x07 → stored, flag=0x00 → empty slot
    if (payload.length > 7 && payload[0] === 0x02 && payload[1] === 0x02) {
      const STRIDE = 18;
      const numRecords = Math.floor((payload.length - 7) / STRIDE);
      for (let i = 0; i < numRecords; i++) {
        const off = 7 + i * STRIDE;
        const flag = payload[off];
        const nameEnd = payload.indexOf(0x00, off + 1);
        const end = nameEnd >= 0 && nameEnd < off + 17 ? nameEnd : off + 17;
        const name = payload.slice(off + 1, end).toString("ascii").trimEnd();
        // null name signals empty slot; string (possibly "") signals stored slot
        this.emit("sceneName", i, flag !== 0 ? name : null);
      }
      return;
    }
    // Full-state format: scan for embedded records sent after recall/rename/store
    // Pattern: 00 02 18 [sceneId] 40 00 00 [name 16 bytes]
    for (let i = 0; i + 23 < payload.length; i++) {
      if (payload[i]   === 0x00 &&
          payload[i+1] === 0x02 &&
          payload[i+2] === 0x18 &&
          payload[i+4] === 0x40 &&
          payload[i+5] === 0x00 &&
          payload[i+6] === 0x00) {
        const sceneId = payload[i+3];
        const nameEnd = payload.indexOf(0x00, i + 7);
        const name = payload.slice(i + 7, nameEnd < 0 || nameEnd > i + 23 ? i + 23 : nameEnd)
          .toString("ascii").trimEnd();
        if (name) this.emit("sceneName", sceneId, name);
        i += 23;
      }
    }
  }

  // Confirmed ParamData offsets (SQ5 FW 1.6, 97376-byte payload).
  //
  // 336-byte channel block at (884 + b3*336):
  //   +0..15   name (16-byte null-padded ASCII)
  //   +84,85   HPF freq LE16
  //   +86      HPF slope byte (1=12dB, 2=18dB, 3=24dB)
  //   +87      HPF on/off byte
  //   +92,93   Gate attack LE16
  //   +94,95   Gate release LE16
  //   +96,97   Gate hold LE16
  //   +98,99   Gate threshold LE16
  //   +100,101 Gate depth LE16
  //   +121     Gate on/off byte
  //   +124,125 PEQ LF gain LE16
  //   +126,127 PEQ LF freq LE16
  //   +130,131 PEQ LM gain LE16
  //   +136,137 PEQ HM gain LE16
  //   +142,143 PEQ HF gain LE16
  //   +302     Comp on/off byte
  //   +304,305 Delay duration LE16
  //   +306     Delay on/off byte
  //   +324,325 Trim LE16
  //   +332     flags: bit0=polarity, bit1=mute
  //
  // 300-byte section at (43520 + b3*300):
  //   +0..67   Bus 1-12 send LE16 (stride 6: bus N at +0+(N-1)*6)
  //   +96,97   Fader LE16
  //   +98      Pan byte (0–74, center=37)
  //   +114,115 FX1 send LE16
  //   +120,121 FX2 send LE16
  //   +126,127 FX3 send LE16
  //   +132,133 FX4 send LE16
  private _parseInitialState(payload: Buffer): void {
    const dsp = (b3: number, cat: number, reg: number, mod: number, val: number) =>
      this.emit("dsp", { ch: b3, category: cat, register: reg, modifier: mod, value: val } as DspFrame);

    for (let b3 = 0; b3 <= 0x7f; b3++) {
      const blk = 884  + b3 * 336;
      const sec = 43520 + b3 * 300;

      // ── Block section ─────────────────────────────────────────────────────
      if (blk + 336 <= payload.length) {
        // name
        const nameEnd = payload.indexOf(0x00, blk);
        const name = payload.slice(blk, nameEnd < 0 || nameEnd > blk + 16 ? blk + 16 : nameEnd).toString("ascii");
        if (name.length > 0) this.emit("channelName", b3, name);

        // Gain (preamp section at absolute offset 80028, stride 336)
        const gainOffset = 80028 + b3 * 336;
        if (gainOffset + 2 <= payload.length) {
          dsp(b3, 0x0c, 0x0c, 0x01, payload.readUInt16LE(gainOffset));
        }

        // HPF
        dsp(b3, 0x0e, 0x0d, 0x00, payload.readUInt16LE(blk + 84));  // freq
        dsp(b3, 0x0e, 0x0e, 0x00, payload[blk + 86]);                // slope
        dsp(b3, 0x0e, 0x0c, 0x00, payload[blk + 87]);                // on/off

        // Gate
        dsp(b3, 0x0f, 0x10, 0x00, payload.readUInt16LE(blk + 92));   // attack
        dsp(b3, 0x0f, 0x11, 0x00, payload.readUInt16LE(blk + 94));   // release
        dsp(b3, 0x0f, 0x12, 0x00, payload.readUInt16LE(blk + 96));   // hold
        dsp(b3, 0x0f, 0x0e, 0x00, payload.readUInt16LE(blk + 98));   // threshold
        dsp(b3, 0x0f, 0x0f, 0x00, payload.readUInt16LE(blk + 100));  // depth
        dsp(b3, 0x0f, 0x0c, 0x00, payload[blk + 121]);               // on/off

        // PEQ on/off
        dsp(b3, 0x38, 0x1a, 0x00, payload[blk + 173]);               // on/off

        // PEQ bands (gain + freq for each — Q and shape TBD)
        dsp(b3, 0x38, 0x0c, 0x00, payload.readUInt16LE(blk + 124));  // LF gain
        dsp(b3, 0x38, 0x0d, 0x00, payload.readUInt16LE(blk + 126));  // LF freq
        dsp(b3, 0x38, 0x10, 0x00, payload.readUInt16LE(blk + 130));  // LM gain
        dsp(b3, 0x38, 0x13, 0x00, payload.readUInt16LE(blk + 136));  // HM gain
        dsp(b3, 0x38, 0x16, 0x00, payload.readUInt16LE(blk + 142));  // HF gain

        // Comp
        dsp(b3, 0x13, 0x0c, 0x00, payload[blk + 302]);               // on/off

        // Delay
        dsp(b3, 0x14, 0x0d, 0x00, payload.readUInt16LE(blk + 304));  // duration
        dsp(b3, 0x14, 0x0c, 0x00, payload[blk + 306]);               // on/off

        // Trim
        dsp(b3, 0x0c, 0x0f, 0x00, payload.readUInt16LE(blk + 324));

        // Flags byte: bit0=polarity, bit1=mute
        const flags = payload[blk + 332];
        dsp(b3, 0x0c, 0x10, 0x00, flags & 0x01);   // polarity
        dsp(b3, 0x07, 0x0c, 0x00, (flags >> 1) & 0x01);  // mute
      }

      // ── Section (fader/sends) ──────────────────────────────────────────────
      if (sec + 134 <= payload.length) {
        // Bus sends (12 buses, stride 6)
        for (let bus = 0; bus < 12; bus++) {
          dsp(b3, 0x09, 0x0e, 0x10 + bus, payload.readUInt16LE(sec + bus * 6));
        }

        dsp(b3, 0x07, 0x0e, 0x20, payload.readUInt16LE(sec + 96));  // fader
        dsp(b3, 0x08, 0x10, 0x20, payload[sec + 98]);               // pan (0–74)

        // FX sends (4 FX slots, stride 6)
        for (let fx = 0; fx < 4; fx++) {
          dsp(b3, 0x09, 0x0e, 0x23 + fx, payload.readUInt16LE(sec + 114 + fx * 6));
        }
      }
    }
    this.emit("initialState");
  }

  private _startKeepalive(): void {
    this.kaTimer = setInterval(() => {
      if (this._connected && this.tcp) this.tcp.write(encodeKeepalive());
    }, KEEPALIVE_INTERVAL_MS);
    this.kaTimer.unref();
  }

  private _stopKeepalive(): void {
    if (this.kaTimer) { clearInterval(this.kaTimer); this.kaTimer = null; }
  }
}
