import * as dgram from "node:dgram";
import { EventEmitter } from "node:events";

export type OscArgValue = number | string;
export interface OscMessage {
  address: string;
  args: OscArgValue[];
}
export interface RemoteInfo {
  address: string;
  port: number;
  family: string;
  size: number;
}

// ─── OSC encoding ─────────────────────────────────────────────────────────────

function pad4(len: number): number {
  return Math.ceil(len / 4) * 4;
}

function encodeString(s: string): Uint8Array {
  const encoded = new TextEncoder().encode(s);
  const size = pad4(encoded.length + 1);
  const buf = new Uint8Array(size);
  buf.set(encoded);
  return buf;
}

function concatU8(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const a of arrays) { out.set(a, pos); pos += a.length; }
  return out;
}

export function encodeOsc(address: string, args: OscArgValue[]): Uint8Array {
  let typetag = ",";
  const argBufs: Uint8Array[] = [];
  for (const arg of args) {
    if (typeof arg === "string") {
      typetag += "s";
      argBufs.push(encodeString(arg));
    } else if (Number.isInteger(arg)) {
      typetag += "i";
      const b = new Uint8Array(4);
      new DataView(b.buffer).setInt32(0, arg, false);
      argBufs.push(b);
    } else {
      typetag += "f";
      const b = new Uint8Array(4);
      new DataView(b.buffer).setFloat32(0, arg, false);
      argBufs.push(b);
    }
  }
  return concatU8(encodeString(address), encodeString(typetag), ...argBufs);
}

// ─── OSC decoding ─────────────────────────────────────────────────────────────

function decodeString(buf: Uint8Array, offset: number): [string, number] {
  let end = offset;
  while (end < buf.length && buf[end] !== 0) end++;
  const s = new TextDecoder().decode(buf.slice(offset, end));
  return [s, offset + pad4(end - offset + 1)];
}

export function decodeOsc(buf: Uint8Array): OscMessage | null {
  try {
    const [address, pos1] = decodeString(buf, 0);
    if (!address.startsWith("/")) return null;

    const [typetag, pos2] = decodeString(buf, pos1);
    if (!typetag.startsWith(",")) return null;

    const args: OscArgValue[] = [];
    let pos = pos2;
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

    for (const tag of typetag.slice(1)) {
      if (tag === "i") {
        args.push(view.getInt32(pos - buf.byteOffset, false));
        pos += 4;
      } else if (tag === "f") {
        args.push(view.getFloat32(pos - buf.byteOffset, false));
        pos += 4;
      } else if (tag === "s") {
        const [s, next] = decodeString(buf, pos);
        args.push(s);
        pos = next;
      } else if (tag === "T") {
        args.push(1);
      } else if (tag === "F") {
        args.push(0);
      }
      // skip unknown tags
    }

    return { address, args };
  } catch {
    return null;
  }
}

// ─── OSC UDP server/client ────────────────────────────────────────────────────

export class OscServer extends EventEmitter {
  private socket: dgram.Socket;

  constructor(port: number) {
    super();
    this.socket = dgram.createSocket("udp4");
    this.socket.on("message", (rawBuf: Buffer, rinfo: dgram.RemoteInfo) => {
      const buf = new Uint8Array(rawBuf.buffer, rawBuf.byteOffset, rawBuf.byteLength);
      const msg = decodeOsc(buf);
      if (msg) this.emit("message", msg, rinfo);
    });
    this.socket.bind(port);
  }

  close(): void {
    this.socket.close();
  }
}

export class OscClient {
  private socket: dgram.Socket;
  private broadcastSocket: dgram.Socket | null = null;

  constructor() {
    this.socket = dgram.createSocket("udp4");
    this.socket.bind(); // ephemeral port for unicast sends
  }

  send(host: string, port: number, address: string, args: OscArgValue[]): void {
    const data = Buffer.from(encodeOsc(address, args));
    this.socket.send(data, port, host);
  }

  broadcast(port: number, address: string, args: OscArgValue[]): void {
    if (!this.broadcastSocket) {
      this.broadcastSocket = dgram.createSocket("udp4");
      this.broadcastSocket.bind(() => {
        this.broadcastSocket!.setBroadcast(true);
      });
    }
    const data = Buffer.from(encodeOsc(address, args));
    this.broadcastSocket.send(data, port, "255.255.255.255");
  }

  close(): void {
    this.socket.close();
    this.broadcastSocket?.close();
  }
}
