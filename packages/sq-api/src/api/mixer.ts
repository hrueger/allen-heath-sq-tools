/**
 * SQMixer — entry point for A&H SQ5/SQ6/SQ7.
 *
 * Usage:
 *   const sq = new SQMixer({ host: "10.22.1.11" });
 *   await sq.connect();
 *
 *   sq.inputs[0].setLevel(0.8);
 *   sq.inputs[0].on("level", (v) => console.log(v));
 *   const level = await sq.inputs[0].getLevel();
 */

import { EventEmitter } from "node:events";
import { Connection, ConnectOptions, VersionInfo, DspFrame } from "../transport/connection";
import { encodeFrame, Sub } from "../transport/frame";
import { discover } from "../transport/discovery";
import * as conv from "./conversions";
import {
  Channel,
  InputChannel,
  StereoInput,
  FxReturn,
  MixBus,
  DcaGroup,
  MainLR,
} from "./channel";

export type SQModel = "SQ5" | "SQ6" | "SQ7";

// IP Patch — input sources
export enum InputPatchSource {
  Local  = 0x01,
  SLink  = 0x02,
  USB    = 0x03,
  IOPort = 0x04,
}

// IP Patch — output destinations
export enum OutputPatchDest {
  Local  = 0x1a,
  ME     = 0x1b,
  SLink  = 0x1c,
  USB    = 0x1d,
  IOPort = 0x1e,
}

// IP Patch — monitor output sources (used with setOutputPatchMonitor)
export enum MonitorOutSource {
  PaflL    = 0x00,
  PaflR    = 0x01,
  ListenL  = 0x02,
  ListenR  = 0x03,
  ListenM  = 0x04,
  Talkback = 0x05,
}

export interface SQMixerOptions extends ConnectOptions {
  model?: SQModel;
  autoDiscover?: boolean;
  broadcastAddress?: string;
}

export class SQMixer extends EventEmitter {
  readonly conn: Connection;
  readonly inputs: InputChannel[];
  readonly stereoInputs: StereoInput[];
  readonly fxReturns: FxReturn[];
  readonly buses: MixBus[];
  readonly dcas: DcaGroup[];
  readonly mainLR: MainLR;
  readonly muteGroups: (boolean | null)[];
  readonly sceneNames: (string | null)[] = Array(300).fill(null);
  readonly sceneCrossfadeMs: (number | null)[] = Array(300).fill(null);
  /** true=stored, false=confirmed empty, null=not yet loaded */
  readonly sceneStored: (boolean | null)[] = Array(300).fill(null);
  talkbackOn: boolean | null = null;
  talkbackGainDb: number | null = null;

  private _byB3 = new Map<number, Channel>();
  private opts: SQMixerOptions;

  constructor(opts: SQMixerOptions) {
    super();
    this.opts = opts;
    this.conn = new Connection(opts);

    // Build typed collections
    this.inputs = Array.from({ length: 48 }, (_, i) => new InputChannel(this.conn, i, `Ip${i + 1}`));
    this.stereoInputs = Array.from({ length: 3 }, (_, i) => new StereoInput(this.conn, 0x30 + i, `St${i + 1}`));
    this.fxReturns = Array.from({ length: 4 }, (_, i) => new FxReturn(this.conn, 0x40 + i, `FX${i + 1}`));
    this.buses = Array.from({ length: 12 }, (_, i) => new MixBus(this.conn, 0x58 + i, `Mx${i + 1}`));
    // DCA b3 range 0x37-0x3E — unconfirmed, but avoids b3=0-7 collision with inputs.
    this.dcas = Array.from({ length: 8 }, (_, i) => new DcaGroup(this.conn, 0x37 + i, `DCA${i + 1}`));
    this.mainLR = new MainLR(this.conn, 0x68, 'LR');

    // Mute groups 1-8 state (null until first update)
    this.muteGroups = Array.from({ length: 8 }, () => null);

    // Build b3 → channel lookup
    for (const ch of this.inputs) this._byB3.set(ch.b3, ch);
    for (const ch of this.stereoInputs) this._byB3.set(ch.b3, ch);
    for (const ch of this.fxReturns) this._byB3.set(ch.b3, ch);
    for (const ch of this.buses) this._byB3.set(ch.b3, ch);
    for (const ch of this.dcas) this._byB3.set(ch.b3, ch);
    this._byB3.set(this.mainLR.b3, this.mainLR);

    // Route DSP frames to channels or handle globally
    this.conn.on("dsp", (d: DspFrame) => {
      // Scene events (category=0x02) — must be checked before b3 lookup because scene IDs
      // 0x00–0x17 overlap with input channel b3 addresses.
      // 0x1b = scene cursor/selected; 0x1c = scene recalled/loaded (after Go); 0x1a = deleted.
      if (d.category === 0x02) {
        const sceneNum = d.ch + 1;
        if (d.register === 0x1c && d.value === 0xffff) {
          this.emit("scene-recall", sceneNum);
        } else if (d.register === 0x1a) {
          this.emit("scene-delete", sceneNum);
        }
        return;
      }
      // Mute groups: register=0x1a, category=0x07 (not 0x38 which is PEQ)
      if (d.register === 0x1a && d.category === 0x07 && d.ch >= 0x00 && d.ch <= 0x07) {
        this.muteGroups[d.ch] = d.value !== 0;
        this.emit("mute-group", d.ch + 1, d.value !== 0);
      } else {
        const ch = this._byB3.get(d.ch);
        if (ch) ch._onDsp(d.register, d.value, d.category, d.modifier);
      }
    });

    // Route channel names from ParamData initial state
    this.conn.on("channelName", (b3: number, name: string) => {
      const ch = this._byB3.get(b3);
      if (ch) ch._onName(name);
    });

    // Scene name/stored updates from ChannelInfo frames
    this.conn.on("sceneName", (sceneId: number, name: string | null) => {
      if (sceneId >= 0 && sceneId < this.sceneNames.length) {
        const stored = name !== null;
        (this.sceneNames   as (string | null)[])[sceneId]  = stored ? name : null;
        (this.sceneStored  as (boolean | null)[])[sceneId] = stored;
        this.emit("scene-name",   sceneId + 1, name);
        this.emit("scene-stored", sceneId + 1, stored);
      }
    });

    // Forward initialState event
    this.conn.on("initialState", () => this.emit("initialState"));

    // Emit connection/disconnect events
    this.conn.on("connect", (v: VersionInfo) => this.emit("connect", v));
    this.conn.on("disconnect", (e: boolean) => this.emit("disconnect", e));
    this.conn.on("error", (e: Error) => this.emit("error", e));
  }

  async connect(): Promise<VersionInfo> {
    if (this.opts.autoDiscover) {
      const found = await discover("SQ", 2000, this.opts.broadcastAddress);
      (this.opts as ConnectOptions).host = found.address;
      // Recreate connection with discovered host
      const newConn = new Connection({ ...this.opts, host: found.address });
      (this as any).conn = newConn;
    }
    await this.conn.connect();
    return this.conn.version!;
  }

  setMuteGroupOn(groupNumber: number, on: boolean): void {
    const groupId = Math.max(0, Math.min(7, groupNumber - 1));
    (this.muteGroups as (boolean | null)[])[groupId] = on;
    this.emit("mute-group", groupId + 1, on);
    const val = on ? 0x0001 : 0x0000;
    this.conn.send(Buffer.from([
      0xf7, 0x07, 0x07, 0x1a, groupId, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
  }

  recallScene(sceneNumber: number): void {
    const sceneId = Math.max(1, Math.min(300, sceneNumber)) - 1;
    this.conn.send(Buffer.from([0xf7, 0x00, 0x02, 0x13, sceneId, 0x30, 0x00, 0x00]));
  }

  storeScene(sceneNumber: number): void {
    const sceneId = Math.max(1, Math.min(300, sceneNumber)) - 1;
    (this.sceneStored as (boolean | null)[])[sceneId] = true;
    this.emit("scene-stored", sceneNumber, true);
    this.conn.send(Buffer.from([0xf7, 0x00, 0x02, 0x1b, sceneId, 0x00, 0xff, 0xff]));
    setTimeout(() => {
      this.conn.send(Buffer.from([0xf7, 0x00, 0x02, 0x0c, sceneId, 0x20, 0x00, 0x00]));
    }, 200);
  }

  deleteScene(sceneNumber: number): void {
    const sceneId = Math.max(1, Math.min(300, sceneNumber)) - 1;
    (this.sceneStored  as (boolean | null)[])[sceneId] = false;
    (this.sceneNames   as (string | null)[])[sceneId]  = null;
    this.emit("scene-stored", sceneId + 1, false);
    this.conn.send(Buffer.from([0xf7, 0x00, 0x02, 0x17, sceneId, 0x20, 0x00, 0x00]));
  }

  setSceneCrossfadeMs(sceneNumber: number, ms: number): void {
    const sceneId = Math.max(1, Math.min(300, sceneNumber)) - 1;
    const wireVal = Math.max(0, Math.min(65535, Math.round(ms)));
    (this.sceneCrossfadeMs as (number | null)[])[sceneId] = wireVal;
    this.conn.send(Buffer.from([
      0xf7, 0x00, 0x02, 0x31, sceneId, 0x40,
      wireVal & 0xff, (wireVal >> 8) & 0xff,
    ]));
  }

  renameScene(sceneNumber: number, name: string): void {
    const sceneId = Math.max(1, Math.min(300, sceneNumber)) - 1;
    const trimmed = name.substring(0, 16);
    (this.sceneNames  as (string | null)[])[sceneId]  = trimmed;
    (this.sceneStored as (boolean | null)[])[sceneId] = true;
    this.emit("scene-name",   sceneNumber, trimmed);
    this.emit("scene-stored", sceneNumber, true);
    const nameBuf = Buffer.alloc(17, 0);
    Buffer.from(trimmed, "ascii").copy(nameBuf);
    const payload = Buffer.concat([
      Buffer.from([0x00, 0x02, 0x18, sceneId, 0x40, 0x00, 0x00]),
      nameBuf,
    ]);
    this.conn.send(encodeFrame(Sub.ChannelInfo, payload));
  }

  setSceneCrossfadeSeconds(seconds: number): void {
    const wireVal = conv.sceneCrossfadeSeconds.toWire(seconds);
    this.conn.send(Buffer.from([
      0xf7, 0x46, 0x02, 0x31, 0x00, 0x00,
      wireVal & 0xff, (wireVal >> 8) & 0xff,
    ]));
  }

  setDirectOutTapPoint(tapPoint: conv.DirectOutTapPoint | number): void {
    const tap = Math.max(0, Math.min(6, tapPoint as number));
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x13, tap, 0x00, 0x00, 0x00,
    ]));
  }

  setDirectOutFollowFader(on: boolean): void {
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x15, on ? 0x01 : 0x00, 0x00, 0x00, 0x00,
    ]));
  }

  setDirectOutFollowDCAFader(on: boolean): void {
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x17, on ? 0x01 : 0x00, 0x00, 0x00, 0x00,
    ]));
  }

  setDirectOutFollowMute(on: boolean): void {
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x14, on ? 0x01 : 0x00, 0x00, 0x00, 0x00,
    ]));
  }

  setDirectOutFollowDCAMute(on: boolean): void {
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x16, on ? 0x01 : 0x00, 0x00, 0x00, 0x00,
    ]));
  }

  setDirectOutFollowMuteGroup(on: boolean): void {
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x18, on ? 0x01 : 0x00, 0x00, 0x00, 0x00,
    ]));
  }

  setDirectOutLevel(dB: number | null): void {
    const wireVal = conv.directOutLevel.toWire(dB);
    this.conn.send(Buffer.from([
      0xf7, 0x3a, 0x07, 0x19, 0x00, 0x00,
      wireVal & 0xff, (wireVal >> 8) & 0xff,
    ]));
  }

  setTalkbackSource(sourceId: number): void {
    this.conn.send(Buffer.from([
      0xf7, 0x38, 0x0b, 0x0d, 0x00, sourceId, 0x00, 0x2a,
    ]));
  }

  setTalkbackOn(on: boolean): void {
    this.talkbackOn = on;
    this.emit("talkback-on", on);
    const val = on ? 0x0001 : 0x0000;
    this.conn.send(Buffer.from([
      0xf7, 0x08, 0x0b, 0x10, 0x00, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
  }

  setTalkbackGain(dB: number): void {
    const clamped = Math.max(-20, Math.min(40, dB));
    this.talkbackGainDb = clamped;
    this.emit("talkback-gain", clamped);
    const wireVal = Math.round(0x8000 + (clamped + 20) / 60 * 0x8000);
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x0c, 0x0c, 0x00, 0x01,
      wireVal & 0xff, (wireVal >> 8) & 0xff,
    ]));
  }

  setTalkbackPhantomOn(on: boolean): void {
    const val = on ? 0x0101 : 0x0001;
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x0c, 0x0d, 0x00, 0x01,
      val & 0xff, (val >> 8) & 0xff,
    ]));
  }

  setTalkbackPadOn(on: boolean): void {
    const val = on ? 0x0101 : 0x0001;
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x0c, 0x0e, 0x00, 0x01,
      val & 0xff, (val >> 8) & 0xff,
    ]));
  }

  setTalkbackHpfOn(on: boolean): void {
    const hpfId = on ? 0x01 : 0x00;
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x15, 0x1f, hpfId, 0x00, 0x00, 0x00,
    ]));
  }

  setTalkbackHpfFreq(hz: number): void {
    const wireVal = Math.round(-9206 + 15308 * Math.log10(hz));
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x15, 0x20, 0x00, wireVal & 0xff, 0x00, 0x00,
    ]));
  }

  setTalkbackTrim(dB: number): void {
    const clamped = Math.max(-24, Math.min(24, dB));
    const wireVal = Math.round(0x0080 + (clamped / 24) * 0x18);
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x15, 0x21, 0x00, wireVal & 0xff, 0x00, 0x00,
    ]));
  }

  setTalkbackMomentary(momentary: boolean): void {
    const val = momentary ? 0x01 : 0x00;
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x0b, 0x11, val, 0x00, 0x00, 0x00,
    ]));
  }

  private setTalkbackRouting(targetId: number, on: boolean): void {
    const val = on ? 0x0100 : 0x0000;
    this.conn.send(Buffer.from([
      0xf7, 0x43, 0x0b, 0x0f, targetId, 0x00,
      val & 0xff, (val >> 8) & 0xff,
    ]));
  }

  setTalkbackToGroup(groupNum: number, on: boolean): void {
    const groupId = 0x48 + Math.max(0, Math.min(3, groupNum - 1));
    this.setTalkbackRouting(groupId, on);
  }

  setTalkbackToAux(auxNum: number, on: boolean): void {
    const auxId = 0x58 + Math.max(0, Math.min(7, auxNum - 1));
    this.setTalkbackRouting(auxId, on);
  }

  setTalkbackToMatrix(mtxNum: number, on: boolean): void {
    const mtxId = 0x73 + Math.max(0, Math.min(5, mtxNum - 1));
    this.setTalkbackRouting(mtxId, on);
  }

  setTalkbackToMainLR(on: boolean): void {
    this.setTalkbackRouting(0x68, on);
  }

  // ── IP Patch ──────────────────────────────────────────────────────────────

  /** Route a physical input source to a mixer destination (DSP input, bus, etc).
   *  dest is the b3 address of the target channel (e.g. sq.inputs[0].b3, sq.buses[0].b3, 0x68 for Main LR). */
  setInputPatch(source: InputPatchSource, sourceChannel: number, destB3: number): void {
    this.conn.send(Buffer.from([
      0xf7, 0x0b, 0x0b, 0x0d,
      sourceChannel & 0xff,
      source,
      destB3 & 0xff,
      0x20,
    ]));
  }

  /** Route a mixer bus output to a physical output socket.
   *  sourceB3 is the b3 address of the source channel/bus (e.g. sq.buses[0].b3, sq.inputs[0].b3 for IP Direct). */
  setOutputPatch(sourceB3: number, dest: OutputPatchDest, destChannel: number): void {
    const dstCh = dest === OutputPatchDest.ME ? 0x13 + destChannel : destChannel - 1;
    this.conn.send(Buffer.from([
      0xf7, 0x0b, 0x0b, 0x0d,
      sourceB3 & 0xff,
      0x0f,
      dstCh & 0xff,
      dest,
    ]));
  }

  /** Route a Rack FX Return output to a physical output socket.
   *  fxReturn: 1–8, channel: 'L' or 'R'. */
  setOutputPatchFxReturn(fxReturn: number, channel: 'L' | 'R', dest: OutputPatchDest, destChannel: number): void {
    const srcCat = channel === 'L' ? 0x16 : 0x17;
    const dstCh = dest === OutputPatchDest.ME ? 0x13 + destChannel : destChannel - 1;
    this.conn.send(Buffer.from([
      0xf7, 0x0b, 0x0b, 0x0d,
      (fxReturn - 1) & 0xff,
      srcCat,
      dstCh & 0xff,
      dest,
    ]));
  }

  /** Route a monitor output (PAFL, Listen, Talkback) to a physical output socket. */
  setOutputPatchMonitor(source: MonitorOutSource, dest: OutputPatchDest, destChannel: number): void {
    const dstCh = dest === OutputPatchDest.ME ? 0x13 + destChannel : destChannel - 1;
    this.conn.send(Buffer.from([
      0xf7, 0x0b, 0x0b, 0x0d,
      source,
      0x11,
      dstCh & 0xff,
      dest,
    ]));
  }

  disconnect(): void {
    this.conn.disconnect();
  }

  get connected(): boolean {
    return this.conn.connected;
  }

  get version(): VersionInfo | null {
    return this.conn.version;
  }
}
