/**
 * Fader calibration script.
 *
 * Listens to raw wire values on Input 1 as you move its fader to
 * specific positions.  Run, then follow the prompts.
 *
 * Usage:
 *   npx ts-node --esm examples/calibrate-fader.ts [host]
 *   # default host: 10.22.1.11
 */

import * as readline from "node:readline";
import { SQMixer } from "../src/index";

const host = process.argv[2] ?? "10.22.1.11";

// The positions we want to sample, in order
const TARGETS = [
  { label: "fully DOWN (−∞, fader at bottom)" },
  { label: "-60 dB   (just above bottom)" },
  { label: "-40 dB" },
  { label: "-20 dB" },
  { label: "-10 dB" },
  { label: "  0 dB  (unity, U mark on fader)" },
  { label: " +5 dB" },
  { label: "+10 dB  (fully UP)" },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<void>((res) => rl.question(q, () => res()));

async function main() {
  console.log(`\nConnecting to ${host}…`);
  const sq = new SQMixer({ host });
  await sq.connect();
  console.log("Connected.\n");

  const ch = sq.inputs[0];

  // Wait for initial state so ch.level is populated
  if (ch.level === null) {
    console.log("Waiting for initial state…");
    await new Promise<void>((res) => {
      const iv = setInterval(() => { if (ch.level !== null) { clearInterval(iv); res(); } }, 100);
    });
  }

  const results: Array<{ label: string; wire: number }> = [];

  for (const target of TARGETS) {
    process.stdout.write(`  → Move INPUT 1 fader to ${target.label}\n`);
    process.stdout.write(`    Then press ENTER to capture…`);

    await ask("");

    const wire = ch.level;
    if (wire === null) {
      console.log("    (no level received yet — captured nothing)\n");
      continue;
    }

    results.push({ label: target.label, wire });
    console.log(`    captured wire = 0x${wire.toString(16).padStart(4, "0")} (${wire})\n`);
  }

  sq.disconnect();
  rl.close();

  console.log("\n══ RESULTS ══════════════════════════════════════════════════");
  console.log("Position                          wire (hex)   wire (dec)");
  console.log("─────────────────────────────────────────────────────────────");
  for (const { label, wire } of results) {
    const hex = `0x${wire.toString(16).padStart(4, "0")}`;
    console.log(`${label.padEnd(33)} ${hex.padStart(10)}   ${wire}`);
  }

  if (results.length >= 2) {
    console.log("\n══ DERIVED CONVERSION ════════════════════════════════════════");
    // Attempt to find unity (0 dB) entry
    const unity = results.find((r) => r.label.includes("0 dB"));
    if (unity) console.log(`  0 dB wire value : 0x${unity.wire.toString(16)} = ${unity.wire}`);
    const top = results.find((r) => r.label.includes("+10"));
    if (top) console.log(`+10 dB wire value : 0x${top.wire.toString(16)} = ${top.wire}`);
    const bottom = results.find((r) => r.label.includes("fully DOWN") || r.label.includes("−∞"));
    if (bottom) console.log(`  −∞  wire value : 0x${bottom.wire.toString(16)} = ${bottom.wire}`);

    if (unity && top && bottom) {
      const range = top.wire - bottom.wire;
      console.log(`\n  Range (bottom→top): ${range} (0x${range.toString(16)})`);
      console.log(`  Suggested formula:`);
      console.log(`    norm = (wire - ${bottom.wire}) / ${range}`);
      console.log(`    wire = ${bottom.wire} + Math.round(norm * ${range})`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
