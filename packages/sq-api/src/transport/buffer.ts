/**
 * SQ byte buffer — all multi-byte integers are little-endian.
 *
 * Confirmed from alo.a bytecode analysis:
 *   i(int)  → write LE-16  (2 bytes)
 *   h(int)  → write LE-32  (4 bytes as two LE-16 words)
 *   j():int → read  LE-16
 *   k():long → read LE-32
 */
export class Buf {
  private data: Buffer;
  private wp = 0; // write position
  private rp = 0; // read position

  constructor(sizeOrData: number | Buffer | Uint8Array = 256) {
    if (Buffer.isBuffer(sizeOrData)) {
      this.data = sizeOrData;
      this.wp = sizeOrData.length;
    } else if (sizeOrData instanceof Uint8Array) {
      this.data = Buffer.from(sizeOrData);
      this.wp = sizeOrData.length;
    } else {
      this.data = Buffer.alloc(sizeOrData);
    }
  }

  // ── write ─────────────────────────────────────────────────────────────────

  writeU8(v: number): this {
    this.data[this.wp++] = v & 0xff;
    return this;
  }

  writeU16LE(v: number): this {
    this.data[this.wp++] = v & 0xff;
    this.data[this.wp++] = (v >> 8) & 0xff;
    return this;
  }

  writeU32LE(v: number): this {
    this.writeU16LE(v & 0xffff);
    this.writeU16LE((v >>> 16) & 0xffff);
    return this;
  }

  writeFloat32LE(v: number): this {
    const b = Buffer.alloc(4);
    b.writeFloatLE(v, 0);
    this.writeBytes(b);
    return this;
  }

  writeBytes(src: Buffer | Uint8Array | number[]): this {
    const b = Array.isArray(src) ? Buffer.from(src) : Buffer.from(src);
    b.copy(this.data, this.wp);
    this.wp += b.length;
    return this;
  }

  writePadded(src: Buffer | Uint8Array, totalLen: number): this {
    const b = Buffer.from(src);
    const copy = Math.min(b.length, totalLen);
    b.copy(this.data, this.wp, 0, copy);
    this.wp += totalLen;
    return this;
  }

  // ── read ──────────────────────────────────────────────────────────────────

  readU8(): number { return this.data[this.rp++]; }

  readU16LE(): number {
    const lo = this.data[this.rp++];
    const hi = this.data[this.rp++];
    return (hi << 8) | lo;
  }

  readU32LE(): number {
    const lo = this.readU16LE();
    const hi = this.readU16LE();
    return ((hi << 16) | lo) >>> 0;
  }

  readFloat32LE(): number {
    const v = this.data.readFloatLE(this.rp);
    this.rp += 4;
    return v;
  }

  readBytes(n: number): Buffer {
    const slice = this.data.slice(this.rp, this.rp + n);
    this.rp += n;
    return Buffer.from(slice);
  }

  readNullTermString(): string {
    const start = this.rp;
    while (this.rp < this.data.length && this.data[this.rp] !== 0) this.rp++;
    const s = this.data.slice(start, this.rp).toString("utf8");
    if (this.rp < this.data.length) this.rp++; // skip null
    return s;
  }

  skip(n: number): this { this.rp += n; return this; }
  seek(pos: number): this { this.rp = pos; return this; }

  // ── utility ───────────────────────────────────────────────────────────────

  toBuffer(): Buffer { return this.data.slice(0, this.wp); }
  get remaining(): number { return this.wp - this.rp; }
  get readPos(): number { return this.rp; }
  get writePos(): number { return this.wp; }
}
