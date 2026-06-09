/**
 * Passive watcher — connects and logs ALL new/changed frames.
 * Move anything on the physical mixer to see what changes.
 *
 * Run: npx ts-node examples/watch.ts
 */

import { Connection, VersionInfo, DspFrame } from "../src/transport/connection";
import { Frame, DSP_MARKER } from "../src/transport/frame";

const HOST = process.env.SQ_HOST ?? "10.22.1.11";

async function main(): Promise<void> {
  console.log("Connecting...\n");
  const conn = new Connection({ host: HOST });

  const lastSeen = new Map<number, Buffer>();

  conn.on("connect", (v: VersionInfo) => {
    console.log(`Connected! FW ${v.fwA}.${v.fwB}  model=${v.model}`);
    console.log("Watching ALL frames. Move faders, press mute buttons, etc.\n");
  });

  conn.on("frame", (f: Frame) => {
    if (f.subType === DSP_MARKER) return; // handled via dsp event

    const key = f.subType;
    const prev = lastSeen.get(key);
    const ts = new Date().toISOString().split("T")[1].slice(0, 12);

    if (!prev) {
      lastSeen.set(key, Buffer.from(f.payload));
      console.log(`[${ts}] NEW sub=0x${key.toString(16).padStart(2,"0")} len=${f.payload.length}`);
      return;
    }

    const len = Math.min(prev.length, f.payload.length);
    let changedCount = 0;
    const changes: string[] = [];

    for (let i = 0; i < len; i++) {
      if (prev[i] !== f.payload[i]) {
        changedCount++;
        if (changes.length < 6) {
          let extra = "";
          if (i + 4 <= len) {
            const fv = f.payload.readFloatLE(i);
            const pv = prev.readFloatLE(i);
            if (isFinite(fv) && isFinite(pv) && Math.abs(fv) < 1e5) {
              extra = ` fl:${pv.toFixed(3)}→${fv.toFixed(3)}`;
            }
            const iv = f.payload.readUInt32LE(i);
            const piv = prev.readUInt32LE(i);
            if (Math.abs(iv) < 0x10000 && iv !== piv) extra = ` int:${piv}→${iv}`;
          }
          changes.push(`0x${i.toString(16).padStart(4,"0")}:${prev[i].toString(16).padStart(2,"0")}→${f.payload[i].toString(16).padStart(2,"0")}${extra}`);
        }
      }
    }
    if (prev.length !== f.payload.length) changedCount++;

    lastSeen.set(key, Buffer.from(f.payload));

    if (changedCount > 0) {
      const subName = subNames[key] ?? `0x${key.toString(16).padStart(2,"0")}`;
      const summary = changedCount > 6 ? `${changes.slice(0,6).join("  ")} +${changedCount-6}more` : changes.join("  ");
      console.log(`[${ts}] CHANGED ${subName}(${f.payload.length})  ${summary}`);
    }
  });

  conn.on("dsp", (d: DspFrame) => {
    const ts = new Date().toISOString().split("T")[1].slice(0, 12);
    const { ch, register, value } = d;
    console.log(`[${ts}] f7 ch=0x${ch.toString(16).padStart(2,"0")} reg=0x${register.toString(16).padStart(2,"0")} val=${value}`);
  });

  conn.on("error", (e: Error) => console.error("Error:", e.message));
  await conn.connect();

  await new Promise((r) => setTimeout(r, 60000));
  console.log("\n[DONE] 60s elapsed.");
  conn.disconnect();
}

const subNames: Record<number, string> = {
  0x00: "MeterSub", 0x02: "Version", 0x03: "Keepalive",
  0x04: "ParamData", 0x08: "ChannelInfo", 0x0e: "FullState",
  0x10: "Block16", 0x12: "Block18", 0x15: "InitState",
  0x19: "Sync",
};

main().catch(console.error);
