import { SQMixer } from "../src/index";

const sq = new SQMixer({ host: "10.22.1.11" });

async function main() {
  try {
    await sq.connect();
    console.log("Connected");

    const ch = sq.inputs[0];

    // Listen to ALL events on this channel using wildcard
    ch.on("gate-on", (v) => console.log(`EVENT: gate-on = ${v}`));
    ch.on("gate-threshold", (v) => console.log(`EVENT: gate-threshold = ${v}`));
    ch.on("level", (v) => console.log(`EVENT: level = ${v}`));
    ch.on("mute", (v) => console.log(`EVENT: mute = ${v}`));

    console.log("Setting Gate On...");
    ch.setGateOn(true);

    await new Promise((r) => setTimeout(r, 2000));

    console.log("Setting Mute...");
    ch.setMute(true);

    await new Promise((r) => setTimeout(r, 2000));

    console.log("Received events:", {
      gateOn: ch.gateOn,
      gateThreshold: ch.gateThreshold,
      level: ch.level,
      muted: ch.muted,
    });

    sq.disconnect();
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

main();
