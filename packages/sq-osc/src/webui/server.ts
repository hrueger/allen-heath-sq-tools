import { saveConfig, type BridgeConfig } from "../config.ts";
import type { OscEntry } from "../registry/index.ts";
import { renderConfigPage } from "./page-config.ts";
import { renderDocsPage, renderDocsMd } from "./page-docs.ts";
import { renderStatusPage, type BridgeStatus } from "./page-status.ts";

export function startWebUi(config: BridgeConfig, entries: OscEntry[], getStatus: () => BridgeStatus, onConfigSave: (newConfig: BridgeConfig) => void): void {
    const enc = new TextEncoder();
    const sseClients = new Set<ReadableStreamDefaultController<Uint8Array>>();

    Deno.serve({ port: config.webUiPort, onListen: () => {} }, async (req: Request) => {
        const url = new URL(req.url);

        // ── GET /status/events — Server-Sent Events ───────────────────────────────
        if (req.method === "GET" && url.pathname === "/status/events") {
            const stream = new ReadableStream<Uint8Array>({
                start(controller) {
                    sseClients.add(controller);
                    // send current state immediately
                    const data = JSON.stringify(getStatus());
                    controller.enqueue(enc.encode(`data: ${data}\n\n`));
                },
                cancel(controller) {
                    sseClients.delete(controller as ReadableStreamDefaultController<Uint8Array>);
                },
            });
            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        // ── GET / — status dashboard ──────────────────────────────────────────────
        if (req.method === "GET" && url.pathname === "/") {
            return new Response(renderStatusPage(getStatus()), {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        // ── GET /config ───────────────────────────────────────────────────────────
        if (req.method === "GET" && url.pathname === "/config") {
            return new Response(renderConfigPage(config), {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        // ── POST /config ──────────────────────────────────────────────────────────
        if (req.method === "POST" && url.pathname === "/config") {
            const body = await req.text();
            const params = new URLSearchParams(body);
            const newConfig: BridgeConfig = {
                mixerHost: params.get("mixerHost")?.trim() || null,
                oscInPort: parseInt(params.get("oscInPort") ?? "") || config.oscInPort,
                oscOutPort: parseInt(params.get("oscOutPort") ?? "") || config.oscOutPort,
                oscTargetHost: params.get("oscTargetHost")?.trim() || null,
                oscBroadcastAddress: config.oscBroadcastAddress,
                webUiPort: parseInt(params.get("webUiPort") ?? "") || config.webUiPort,
                debug: config.debug,
            };
            await saveConfig(newConfig);
            onConfigSave(newConfig);
            return new Response(null, {
                status: 303,
                headers: { Location: "/config?saved=1" },
            });
        }

        // ── GET /docs ─────────────────────────────────────────────────────────────
        if (req.method === "GET" && url.pathname === "/docs") {
            return new Response(renderDocsPage(entries), {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        // ── GET /docs/osc-reference.md ────────────────────────────────────────────
        if (req.method === "GET" && url.pathname === "/docs/osc-reference.md") {
            return new Response(renderDocsMd(entries), {
                headers: {
                    "Content-Type": "text/markdown; charset=utf-8",
                    "Content-Disposition": 'attachment; filename="osc-reference.md"',
                },
            });
        }

        return new Response("Not Found", { status: 404 });
    });

    // Push SSE updates every second
    setInterval(() => {
        if (sseClients.size === 0) return;
        const data = JSON.stringify(getStatus());
        const payload = enc.encode(`data: ${data}\n\n`);
        for (const ctrl of sseClients) {
            try {
                ctrl.enqueue(payload);
            } catch {
                sseClients.delete(ctrl);
            }
        }
    }, 1000);
}
