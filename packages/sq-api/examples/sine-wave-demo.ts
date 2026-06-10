#!/usr/bin/env ts-node
import { SQMixer } from "../src/index";

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(title: string): void {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`  ${title}`);
    console.log(`${"=".repeat(70)}\n`);
}

async function main() {
    const sq = new SQMixer({ host: "10.22.1.11", port: 51326 });

    try {
        await sq.connect();
        console.log("✓ Connected to SQ5\n");

        // ========================================================================
        // SINE WAVE with BLINKING MUTES
        // ========================================================================
        log("SINE WAVE FADERS + BLINKING MUTES");
        console.log("Channels 1-16 moving in sine wave pattern\n");

        const duration = 10000; // 10 seconds
        const startTime = Date.now();
        const frameRate = 30; // ~33ms per frame
        const muteBlinkRate = 200; // blink every 200ms

        let blinkState = true;

        while (Date.now() - startTime < duration) {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            // Create a wave offset for each channel (staggered)
            for (let i = 0; i < 16; i++) {
                const ch = sq.inputs[i];
                const channelOffset = (i / 16) * Math.PI * 2; // Stagger each channel
                const waveValue = (Math.sin(progress * Math.PI * 2 + channelOffset) + 1) * 20 - 30;

                ch.setLevel(waveValue);
            }

            // Blink mutes
            if (elapsed % (muteBlinkRate * 2) < muteBlinkRate) {
                if (!blinkState) {
                    for (let i = 0; i < 16; i++) {
                        sq.inputs[i].setMute(false);
                    }
                    blinkState = true;
                }
            } else {
                if (blinkState) {
                    for (let i = 0; i < 16; i++) {
                        sq.inputs[i].setMute(true);
                    }
                    blinkState = false;
                }
            }

            await sleep(frameRate);
        }

        // Reset to safe state
        console.log("\n\n  Resetting to safe state...");
        for (let i = 0; i < 16; i++) {
            sq.inputs[i].setLevel(0.5);
            sq.inputs[i].setMute(false);
        }

        console.log("\n" + "=".repeat(70));
        console.log("  ✓ SINE WAVE DEMO COMPLETED");
        console.log("=".repeat(70) + "\n");

        sq.disconnect();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main();
