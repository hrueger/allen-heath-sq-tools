/**
 * API Demo — shows how to use the SQMixer and Channel control APIs.
 *
 * Run: npx ts-node examples/api-demo.ts
 */

import { SQMixer, DirectOutTapPoint } from "../src/index";

async function demo() {
  const sq = new SQMixer({ host: "10.22.1.11" });

  sq.on("connect", (v) => {
    console.log(`✓ Connected! FW ${v.fwA}.${v.fwB} model=${v.model}\n`);
  });

  sq.on("error", (e) => console.error("Error:", e.message));

  console.log("Connecting...");
  await sq.connect();

  // Control Input 1
  console.log("1. Moving Input 1 fader to 0.8...");
  sq.inputs[0].setLevel(0.8);
  console.log(`   Input 1 level (cached): ${sq.inputs[0].level}`);

  await sleep(1000);

  // Control Input 2 mute
  console.log("2. Muting Input 2...");
  sq.inputs[1].setMute(true);
  console.log(`   Input 2 muted (cached): ${sq.inputs[1].muted}`);

  await sleep(1000);

  // Subscribe to Input 1 level changes
  console.log("3. Subscribing to Input 1 level changes (move fader on console)...");
  sq.inputs[0].on("level", (v) => console.log(`   Input 1 level: ${v}`));
  await sleep(3000);

  // Control Mix Bus 1
  console.log("4. Moving Mix Bus 1 to 0.6...");
  sq.buses[0].setLevel(0.6);

  await sleep(1000);

  // Control Main LR
  console.log("5. Muting Main LR...");
  sq.mainLR.setMute(true);

  await sleep(1000);

  console.log("6. Unmuting Main LR...");
  sq.mainLR.setMute(false);

  await sleep(1000);

  // Direct Out routing
  console.log("7. Assigning Input 1 to Direct Out 1...");
  sq.inputs[0].setDirectOut(1);

  await sleep(1000);

  // Direct Out config
  console.log("8. Setting Direct Out tap point to Post Compressor...");
  sq.setDirectOutTapPoint(DirectOutTapPoint.PostCompressor);
  sq.setDirectOutFollowFader(true);
  sq.setDirectOutFollowMute(true);

  await sleep(1000);

  console.log("9. Clearing Direct Out assignment...");
  sq.inputs[0].setDirectOut(null);

  console.log("\n✓ Demo complete.");
  sq.disconnect();
  process.exit(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

demo().catch(console.error);
