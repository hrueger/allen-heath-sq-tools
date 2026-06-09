#!/usr/bin/env ts-node
/**
 * Animated rainbow across the first 16 input channel LCDs.
 * The hue offset scrolls continuously — Ctrl+C to stop and reset.
 */
import { SQMixer } from "../src/api/mixer";

const HOST     = "10.22.1.11";
const CHANNELS = 16;
const FPS      = 20;           // frames per second
const SPEED    = 0.4;          // full hue rotations per second

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 1) + 1) % 1;      // wrap to [0, 1)
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0: [r, g, b] = [v, t, p]; break;
    case 1: [r, g, b] = [q, v, p]; break;
    case 2: [r, g, b] = [p, v, t]; break;
    case 3: [r, g, b] = [p, q, v]; break;
    case 4: [r, g, b] = [t, p, v]; break;
    default:[r, g, b] = [v, p, q]; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

async function main() {
  const sq = new SQMixer({ host: HOST });
  await sq.connect();
  await new Promise<void>(r => sq.once("initialState", r));
  console.log(`Connected. Animating rainbow on ch1–${CHANNELS} at ${FPS} fps — Ctrl+C to stop.`);

  const reset = async () => {
    process.stdout.write("\nResetting to transparent… ");
    for (let i = 0; i < CHANNELS; i++) sq.inputs[i].setColorTransparent();
    await new Promise(r => setTimeout(r, 200));
    sq.disconnect();
    console.log("Done.");
    process.exit(0);
  };

  process.on("SIGINT", reset);

  const start   = Date.now();
  const interval = setInterval(() => {
    const t      = (Date.now() - start) / 1000;
    const offset = t * SPEED;

    process.stdout.write(`\r  t=${t.toFixed(1).padStart(5)}s  `);
    for (let i = 0; i < CHANNELS; i++) {
      const hue = offset + i / CHANNELS;
      const [r, g, b] = hsvToRgb(hue, 1.0, 1.0);
      sq.inputs[i].setColor(r, g, b);
      process.stdout.write(`\x1b[38;2;${r};${g};${b}m█\x1b[0m`);
    }
  }, 1000 / FPS);

  // Keep alive (interval already does it; this just prevents early exit)
  await new Promise(() => {});
}

main().catch(e => { console.error(e); process.exit(1); });
