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
  autoOpenBrowser: boolean;
}

export const DEFAULTS: BridgeConfig = {
  mixerHost: null,
  oscInPort: 8000,
  oscOutPort: 9000,
  oscTargetHost: null,
  oscBroadcastAddress: "255.255.255.255",
  webUiPort: 3000,
  autoOpenBrowser: true,
};

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
  const c = { ...config };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mixer-ip" && args[i + 1]) c.mixerHost = args[++i];
    else if (arg === "--osc-in" && args[i + 1]) c.oscInPort = parseInt(args[++i]);
    else if (arg === "--osc-out" && args[i + 1]) c.oscOutPort = parseInt(args[++i]);
    else if (arg === "--osc-target" && args[i + 1]) c.oscTargetHost = args[++i];
    else if (arg === "--web-port" && args[i + 1]) c.webUiPort = parseInt(args[++i]);
    else if (arg === "--no-browser") c.autoOpenBrowser = false;
  }
  return c;
}
