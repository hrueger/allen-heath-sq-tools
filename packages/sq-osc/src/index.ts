import { SQMixer } from "@allen-heath-sq-tools/api";
import { loadConfig, saveConfig, applyCliArgs, type BridgeConfig } from "./config.ts";
import { buildRegistry } from "./registry/index.ts";
import { OscServer, OscClient } from "./osc.ts";
import { OscRouter } from "./router.ts";
import { wireBridge } from "./bridge.ts";
import { startWebUi } from "./webui/server.ts";
import { openBrowser } from "./open-browser.ts";
import type { BridgeStatus } from "./webui/page-status.ts";

let sq: SQMixer | null = null;
let oscServer: OscServer | null = null;
let oscClient: OscClient | null = null;
let version: string | null = null;
let config: BridgeConfig;

const { registry, entries } = buildRegistry();
const router = new OscRouter(registry);

function getStatus(): BridgeStatus {
  return {
    connected: sq?.connected ?? false,
    mixerHost: config.mixerHost,
    version,
    oscInPort: config.oscInPort,
    oscOutPort: config.oscOutPort,
    webUiPort: config.webUiPort,
  };
}

async function connectMixer(cfg: BridgeConfig): Promise<void> {
  if (sq) {
    try { sq.disconnect(); } catch { /* ignore */ }
    sq = null;
    version = null;
  }

  const instance = new SQMixer({
    host: cfg.mixerHost ?? "0.0.0.0",
    autoDiscover: cfg.mixerHost === null,
    broadcastAddress: cfg.oscBroadcastAddress,
  });

  sq = instance;

  if (oscClient) {
    wireBridge(instance, oscClient, cfg);
  }

  instance.on("connect", (v) => {
    version = `fw${v.fwA}.${v.fwB}${v.build !== undefined ? `.${v.build}` : ""}`;
    console.log(`[sq] connected — firmware ${version}`);
  });

  instance.on("disconnect", () => {
    version = null;
    console.log("[sq] disconnected");
  });

  try {
    const v = await instance.connect();
    version = `fw${v.fwA}.${v.fwB}${v.build !== undefined ? `.${v.build}` : ""}`;
    console.log(`[sq] connected — firmware ${version}`);
  } catch (err) {
    console.error("[sq] connection failed:", (err as Error).message);
    console.log("     Check mixer IP in the web UI or ensure the mixer is reachable.");
  }
}

function restartOsc(cfg: BridgeConfig): void {
  if (oscServer) { try { oscServer.close(); } catch { /* ignore */ } }
  if (oscClient) { try { oscClient.close(); } catch { /* ignore */ } }

  oscClient = new OscClient();
  oscServer = new OscServer(cfg.oscInPort);

  oscServer.on("message", (msg, rinfo) => {
    if (!sq) return;
    router.handle(sq, msg.address, msg.args, rinfo);
  });

  if (sq) wireBridge(sq, oscClient, cfg);

  console.log(`[osc] listening on port ${cfg.oscInPort}`);
  console.log(`[osc] sending feedback to ${cfg.oscTargetHost ?? "255.255.255.255"}:${cfg.oscOutPort}`);
}

async function main(): Promise<void> {
  const rawConfig = await loadConfig();
  config = applyCliArgs(rawConfig, Deno.args.slice());

  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║       SQ OSC Bridge  v0.1.0           ║");
  console.log("╚═══════════════════════════════════════╝\n");

  startWebUi(config, entries, getStatus, async (newConfig) => {
    config = newConfig;
    restartOsc(newConfig);
    await connectMixer(newConfig);
  });

  const webUrl = `http://localhost:${config.webUiPort}`;
  console.log(`[web]  ${webUrl}`);
  console.log(`[docs] ${webUrl}/docs`);

  restartOsc(config);
  await connectMixer(config);

  if (config.autoOpenBrowser) {
    setTimeout(() => openBrowser(webUrl), 800);
  }

  // Keep alive and handle shutdown
  Deno.addSignalListener("SIGINT", shutdown);
  Deno.addSignalListener("SIGTERM", shutdown);
}

function shutdown(): void {
  console.log("\n[bridge] shutting down...");
  try { sq?.disconnect(); } catch { /* ignore */ }
  try { oscServer?.close(); } catch { /* ignore */ }
  try { oscClient?.close(); } catch { /* ignore */ }
  Deno.exit(0);
}

await main();
