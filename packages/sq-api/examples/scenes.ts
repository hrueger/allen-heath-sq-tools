#!/usr/bin/env ts-node
import { SQMixer } from "../src/api/mixer";

async function main() {
    const sq = new SQMixer({ host: "10.22.1.11", port: 51326 });

    try {
        await sq.connect();
        console.log("Connected to SQ5\n");

        console.log("=== Testing Scene Recall ===");
        for (let i = 1; i <= 3; i++) {
            sq.recallScene(i);
            console.log(`Sent: recallScene(${i})`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        console.log("\n=== Testing Scene Store ===");
        sq.storeScene(5);
        console.log(`Sent: storeScene(5)`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        sq.storeScene(6);
        console.log(`Sent: storeScene(6)`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log("\n=== Testing Scene Delete ===");
        sq.deleteScene(5);
        console.log(`Sent: deleteScene(5)`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        sq.deleteScene(6);
        console.log(`Sent: deleteScene(6)`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log("\n✓ Scene operations test completed successfully");

        sq.disconnect();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main();
