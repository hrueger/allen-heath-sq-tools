import type { SQMixer } from "@allen-heath-sq-tools/api";
import type { OscEntry, OscRegistry } from "./registry/index.ts";
import type { RemoteInfo } from "./osc.ts";
import { OscClient } from "./osc.ts";

interface CompiledPattern {
  re: RegExp;
  entry: OscEntry;
  paramNames: string[];
}

export class OscRouter {
  private patterns: CompiledPattern[];
  private reply: OscClient;
  private debug: boolean;

  constructor(registry: OscRegistry, debug = false) {
    this.reply = new OscClient();
    this.debug = debug;
    this.patterns = [];

    for (const [, entry] of registry) {
      const paramNames: string[] = [];
      const reStr = entry.address
        .replace(/\{(\w+)\}/g, (_m: string, name: string) => {
          paramNames.push(name);
          return "(\\d+)";
        })
        .replace(/\//g, "\\/");
      this.patterns.push({
        re: new RegExp(`^${reStr}$`),
        entry,
        paramNames,
      });
    }
  }

  handle(sq: SQMixer, address: string, args: Array<number | string>, rinfo: RemoteInfo): void {
    for (const { re, entry, paramNames } of this.patterns) {
      const m = re.exec(address);
      if (!m) continue;

      const indices = paramNames.map((_, i) => parseInt(m[i + 1]));

      if (args.length === 0) {
        // GET query
        if (!entry.readable || !entry.get) return;
        const values = entry.get(sq, indices);
        if (values !== undefined) {
          if (this.debug) {
            const argStr = values.map(a => JSON.stringify(a)).join(" ");
            console.log(`[osc out] ${address}${argStr ? " " + argStr : ""} → ${rinfo.address}:${rinfo.port}`);
          }
          this.reply.send(rinfo.address, rinfo.port, address, values);
        }
      } else {
        // SET command
        if (!entry.writable || !entry.set) return;
        try {
          entry.set(sq, indices, args);
        } catch (err) {
          console.error(`[router] error setting ${address}:`, err);
        }
      }
      return;
    }
  }

  close(): void {
    this.reply.close();
  }
}
