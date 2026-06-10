import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";

export interface BridgeConfig {
  mixerHost: string | null;
  oscInPort: number;
  oscOutPort: number;
  oscTargetHost: string | null;
  oscBroadcastAddress: string;
  webUiPort: number;
  debug: boolean;
}

export const DEFAULTS: BridgeConfig = {
  mixerHost: null,
  oscInPort: 8000,
  oscOutPort: 9000,
  oscTargetHost: null,
  oscBroadcastAddress: "255.255.255.255",
  webUiPort: 3000,
  debug: false,
};

function printHelp(): void {
  console.log(`
Usage: sq-osc-bridge [options]

Options:
  --mixer-ip   <ip>    IP address of the SQ mixer (default: auto-discover)
  --osc-in     <port>  UDP port to listen for incoming OSC (default: 8000)
  --osc-out    <port>  UDP port to send OSC feedback on (default: 9000)
  --osc-target <host>  Target host for OSC feedback (default: broadcast)
  --web-port   <port>  Web UI HTTP port (default: 3000)
  --debug              Log all incoming and outgoing OSC messages
  --help, -h           Show this help message
`.trim());
}

export const CONFIG_DIR = join(homedir(), ".config", "sq-osc");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<BridgeConfig> {
  try {
    const data = await readFile(CONFIG_PATH, "utf8");
    return { ...DEFAULTS, ...JSON.parse(data as string) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveConfig(config: BridgeConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export function applyCliArgs(config: BridgeConfig, args: string[]): BridgeConfig {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  const c = { ...config };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mixer-ip" && args[i + 1]) c.mixerHost = args[++i];
    else if (arg === "--osc-in" && args[i + 1]) c.oscInPort = parseInt(args[++i]);
    else if (arg === "--osc-out" && args[i + 1]) c.oscOutPort = parseInt(args[++i]);
    else if (arg === "--osc-target" && args[i + 1]) c.oscTargetHost = args[++i];
    else if (arg === "--web-port" && args[i + 1]) c.webUiPort = parseInt(args[++i]);
    else if (arg === "--debug") c.debug = true;
  }
  return c;
}
