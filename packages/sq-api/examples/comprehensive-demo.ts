#!/usr/bin/env ts-node
import { SQMixer, ChannelColor, DirectOutTapPoint } from "../src/index";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(title: string, message?: string): void {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(70)}`);
  if (message) console.log(message);
}

async function main() {
  const sq = new SQMixer({ host: "10.22.1.11", port: 51326 });

  try {
    await sq.connect();
    console.log("✓ Connected to SQ5\n");

    // ========================================================================
    // FADERS: Move all 16 input channels
    // ========================================================================
    log("FADERS: Sweeping inputs 1-16");
    console.log("Moving faders from minimum to maximum...\n");

    for (let i = 0; i < 16; i++) {
      const ch = sq.inputs[i];
      process.stdout.write(`  Ch ${String(i + 1).padStart(2)} `);

      // Sweep from 0 to 1
      for (let level = 0; level <= 1; level += 0.1) {
        ch.setLevel(level);
        await sleep(50);
      }

      console.log("✓");
    }

    await sleep(500);

    // Return to unity
    console.log("\n  Returning all faders to unity (0.5)...");
    for (let i = 0; i < 16; i++) {
      sq.inputs[i].setLevel(0.5);
    }
    await sleep(500);

    // ========================================================================
    // MUTES: Toggle each input channel
    // ========================================================================
    log("MUTES: Toggling inputs 1-16");
    console.log("Muting channels in sequence...\n");

    for (let i = 0; i < 16; i++) {
      const ch = sq.inputs[i];
      ch.setMute(true);
      console.log(`  Ch ${String(i + 1).padStart(2)}: MUTED`);
      await sleep(100);
    }

    await sleep(500);

    console.log("\nUnmuting channels in sequence...\n");
    for (let i = 0; i < 16; i++) {
      const ch = sq.inputs[i];
      ch.setMute(false);
      console.log(`  Ch ${String(i + 1).padStart(2)}: UNMUTED`);
      await sleep(100);
    }

    await sleep(500);

    // ========================================================================
    // MUTE GROUPS: Toggle all 8 groups
    // ========================================================================
    log("MUTE GROUPS: Activating all 8 groups");
    console.log("Engaging mute groups...\n");

    for (let group = 1; group <= 8; group++) {
      sq.setMuteGroupOn(group, true);
      console.log(`  Mute Group ${group}: ON`);
      await sleep(150);
    }

    await sleep(500);

    console.log("\nDisengaging mute groups...\n");
    for (let group = 1; group <= 8; group++) {
      sq.setMuteGroupOn(group, false);
      console.log(`  Mute Group ${group}: OFF`);
      await sleep(150);
    }

    await sleep(500);

    // ========================================================================
    // CHANNEL NAMES & COLORS: Rename and color first 8 channels
    // ========================================================================
    log("CHANNEL NAMES & COLORS: First 8 inputs");

    const channels = [
      { name: "Vocals", color: ChannelColor.Red },
      { name: "Kick", color: ChannelColor.Yellow },
      { name: "Bass", color: ChannelColor.Blue },
      { name: "Snare", color: ChannelColor.Green },
      { name: "HiHat", color: ChannelColor.Turquoise },
      { name: "Toms", color: ChannelColor.Pink },
      { name: "Perc", color: ChannelColor.White },
      { name: "Pad", color: ChannelColor.Black },
    ];

    console.log("Assigning names and colors...\n");
    for (let i = 0; i < 8; i++) {
      const ch = sq.inputs[i];
      const { name, color } = channels[i];
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;

      ch.setName(name);
      ch.setColor(r, g, b);
      console.log(`  Ch ${i + 1}: "${name}" → RGB(${r}, ${g}, ${b})`);
      await sleep(150);
    }

    await sleep(500);

    // ========================================================================
    // CHANNEL 1 COMPREHENSIVE CONFIGURATION
    // ========================================================================
    log("CHANNEL 1: Full parameter configuration");
    const ch1 = sq.inputs[0];

    console.log("\n--- Basic Controls ---");
    ch1.setLevel(0.7);
    console.log("  ✓ Level: 0.7 (70%)");
    await sleep(200);

    ch1.setPan(-0.3);
    console.log("  ✓ Pan: -0.3 (slightly left)");
    await sleep(200);

    ch1.setMute(false);
    console.log("  ✓ Mute: OFF");
    await sleep(200);

    console.log("\n--- Input Stage ---");
    ch1.setGain(12);
    console.log("  ✓ Gain: +12 dB");
    await sleep(200);

    ch1.setTrim(-3);
    console.log("  ✓ Trim: -3 dB");
    await sleep(200);

    ch1.setPadOn(true);
    console.log("  ✓ Pad: ON (-20 dB)");
    await sleep(200);

    ch1.setPhantomOn(true);
    console.log("  ✓ Phantom Power: ON (48V)");
    await sleep(200);

    ch1.setPolarityOn(false);
    console.log("  ✓ Polarity: NORMAL (no flip)");
    await sleep(200);

    console.log("\n--- High-Pass Filter ---");
    ch1.setHpfOn(true);
    console.log("  ✓ HPF: ON");
    await sleep(200);

    ch1.setHpfFreq(100);
    console.log("  ✓ HPF Frequency: 100 Hz");
    await sleep(200);

    ch1.setHpfSlope(24);
    console.log("  ✓ HPF Slope: 24 dB/octave");
    await sleep(200);

    console.log("\n--- Gate ---");
    ch1.setGateOn(true);
    console.log("  ✓ Gate: ON");
    await sleep(200);

    ch1.setGateThreshold(-30);
    console.log("  ✓ Gate Threshold: -30 dB");
    await sleep(200);

    ch1.setGateDepth(20);
    console.log("  ✓ Gate Depth: 20 dB");
    await sleep(200);

    ch1.setGateAttack(10);
    console.log("  ✓ Gate Attack: 10 ms");
    await sleep(200);

    ch1.setGateHold(50);
    console.log("  ✓ Gate Hold: 50 ms");
    await sleep(200);

    ch1.setGateRelease(100);
    console.log("  ✓ Gate Release: 100 ms");
    await sleep(200);

    console.log("\n--- Compressor ---");
    ch1.setCompOn(true);
    console.log("  ✓ Compressor: ON");
    await sleep(200);

    ch1.setCompThreshold(-20);
    console.log("  ✓ Comp Threshold: -20 dB");
    await sleep(200);

    ch1.setCompRatio(4);
    console.log("  ✓ Comp Ratio: 1:4");
    await sleep(200);

    ch1.setCompGain(6);
    console.log("  ✓ Comp Makeup Gain: +6 dB");
    await sleep(200);

    console.log("\n--- Delay ---");
    ch1.setDelayOn(true);
    console.log("  ✓ Delay: ON");
    await sleep(200);

    ch1.setDelayDuration(150);
    console.log("  ✓ Delay Duration: 150 ms");
    await sleep(200);

    console.log("\n--- Direct Out Configuration ---");
    ch1.setDirectOut(1);
    console.log("  ✓ Ch 1 → Direct Out: Local Out 1");
    await sleep(200);

    sq.setDirectOutTapPoint(DirectOutTapPoint.PostCompressor);
    console.log("  ✓ Direct Out Tap Point: Post-Compressor");
    await sleep(200);

    sq.setDirectOutLevel(-6);
    console.log("  ✓ Direct Out Level: -6 dB");
    await sleep(200);

    sq.setDirectOutFollowFader(true);
    console.log("  ✓ Direct Out Follow Fader: ON");
    await sleep(200);

    sq.setDirectOutFollowMute(true);
    console.log("  ✓ Direct Out Follow Mute: ON");
    await sleep(200);

    console.log("\n--- Sends to Mix Buses ---");
    ch1.setSend(1, 0.6);
    console.log("  ✓ Send to Bus 1: 0.6 (-4.4 dB)");
    await sleep(200);

    ch1.setSend(2, 0.8);
    console.log("  ✓ Send to Bus 2: 0.8 (-1.9 dB)");
    await sleep(200);

    ch1.setSend(3, 0.4);
    console.log("  ✓ Send to Bus 3: 0.4 (-7.9 dB)");
    await sleep(200);

    // ========================================================================
    // RESET DEMO
    // ========================================================================
    log("RESET: Returning to safe defaults");
    console.log("Resetting all parameters...\n");

    // Reset all 16 channels
    for (let i = 0; i < 16; i++) {
      const ch = sq.inputs[i];
      ch.setLevel(0.5);
      ch.setMute(false);
      ch.setPan(0);
      ch.setGain(0);
      ch.setTrim(0);
      ch.setPadOn(false);
      ch.setPhantomOn(false);
      ch.setPolarityOn(false);
      ch.setHpfOn(false);
      ch.setGateOn(false);
      ch.setCompOn(false);
      ch.setDelayOn(false);
      ch.setDirectOut(null);
      ch.setColorTransparent();
    }

    console.log("  ✓ All channels reset to defaults");
    await sleep(500);

    console.log("\n" + "=".repeat(70));
    console.log("  ✓ COMPREHENSIVE DEMO COMPLETED");
    console.log("=".repeat(70) + "\n");

    sq.disconnect();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
