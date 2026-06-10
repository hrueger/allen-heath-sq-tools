import type { OscEntry } from "../registry/index.ts";

function argSpec(args: OscEntry["setArgs"]): string {
  return args.map(a => {
    let spec = `<code>${a.type}</code> <em>${a.name}</em>`;
    if (a.unit) spec += ` <span class="unit">${a.unit}</span>`;
    if (a.min !== undefined && a.max !== undefined) {
      spec += ` <span class="range">${a.min}–${a.max}</span>`;
    } else if (a.choices) {
      spec += ` <span class="range">${a.choices.join(" | ")}</span>`;
    }
    return spec;
  }).join(", ") || "<em>none</em>";
}

function groupLabel(g: string): string {
  const labels: Record<string, string> = {
    input:    "Input channels 1–48",
    stereo:   "Stereo inputs 1–3",
    fxreturn: "FX returns 1–4",
    bus:      "Mix buses 1–12",
    dca:      "DCA groups 1–8",
    main:     "Main L/R",
    global:   "Global / mixer-level",
  };
  return labels[g] ?? g;
}

export function renderDocsPage(entries: OscEntry[]): string {
  const groups = [...new Set(entries.map(e => e.group))];

  const sections = groups.map(group => {
    const rows = entries.filter(e => e.group === group).map(e => {
      const rw = [e.readable ? "R" : "", e.writable ? "W" : ""].filter(Boolean).join("/");
      const setSpec = e.setArgs.length ? argSpec(e.setArgs) : "";
      return `<tr>
        <td><code>${e.address}</code></td>
        <td><span class="rw rw-${rw.toLowerCase().replace("/","")}">${rw}</span></td>
        <td>${setSpec || (e.readable ? argSpec(e.getArgs) : "")}</td>
        <td>${e.description}</td>
      </tr>`;
    }).join("\n");

    return `<h2>${groupLabel(group)}</h2>
<table>
  <thead><tr><th>Address</th><th>R/W</th><th>Arguments</th><th>Description</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SQ OSC Reference</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#1a1a2e;color:#e0e0e0;padding:2rem;font-size:.875rem}
  h1{font-size:1.5rem;font-weight:700;color:#a78bfa;margin-bottom:.25rem}
  .subtitle{color:#9ca3af;margin-bottom:2rem}
  nav{display:flex;gap:1rem;margin-bottom:2rem}
  nav a{color:#a78bfa;text-decoration:none;font-size:.875rem;padding:.4rem .8rem;border-radius:.375rem;background:#2d2d4e}
  nav a:hover{background:#3d3d6e}
  .dl-btn{float:right;background:#7c3aed;color:#fff;border:none;padding:.4rem .9rem;border-radius:.375rem;cursor:pointer;font-size:.875rem;text-decoration:none}
  .dl-btn:hover{background:#6d28d9}
  h2{font-size:1rem;font-weight:600;color:#c4b5fd;margin:2rem 0 .75rem}
  table{width:100%;border-collapse:collapse;margin-bottom:1.5rem}
  th{text-align:left;padding:.5rem .75rem;background:#2d2d4e;color:#9ca3af;font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}
  td{padding:.4rem .75rem;border-bottom:1px solid #2d2d4e;vertical-align:top}
  tr:hover td{background:#1e2a4a}
  code{background:#0f3460;padding:.1em .4em;border-radius:.25rem;font-family:"Fira Code",monospace;font-size:.8125rem}
  .rw{font-size:.75rem;font-weight:700;padding:.15rem .4rem;border-radius:.25rem}
  .rw-rw{background:#1d4ed8;color:#93c5fd}
  .rw-r {background:#065f46;color:#6ee7b7}
  .rw-w {background:#7c2d12;color:#fdba74}
  .unit{color:#a78bfa;font-size:.75rem}
  .range{color:#6b7280;font-size:.75rem}
  em{color:#9ca3af;font-style:normal}
  .get-hint{margin-bottom:1.5rem;background:#16213e;border:1px solid #2d2d4e;border-radius:.5rem;padding:.75rem 1rem;color:#9ca3af;font-size:.8125rem;line-height:1.6}
  .get-hint code{font-size:.75rem}
</style>
</head>
<body>
<h1>SQ OSC Reference <a class="dl-btn" href="/docs/osc-reference.md" download>Download .md</a></h1>
<p class="subtitle">Complete OSC address reference — auto-generated from the live bridge registry.</p>
<nav>
  <a href="/">Status</a>
  <a href="/config">Config</a>
  <a href="/docs">OSC Reference</a>
</nav>
<div class="get-hint">
  <strong>GET:</strong> Send any address with no arguments to query the current value. The bridge replies to your IP/port.<br>
  <strong>SET:</strong> Send an address with the argument(s) listed below to change the value.<br>
  <strong>Feedback:</strong> The bridge broadcasts all parameter changes to the configured OSC target automatically.
</div>
${sections}
</body>
</html>`;
}

export function renderDocsMd(entries: OscEntry[]): string {
  const groups = [...new Set(entries.map(e => e.group))];
  const lines: string[] = [
    "# SQ OSC Reference",
    "",
    "Auto-generated from the sq-osc bridge registry.",
    "",
    "**GET**: send address with no arguments → bridge replies with current value.",
    "**SET**: send address with argument(s) listed below.",
    "**Feedback**: bridge broadcasts all changes automatically.",
    "",
  ];

  for (const group of groups) {
    const groupEntries = entries.filter(e => e.group === group);
    lines.push(`## ${groupLabel(group)}`, "");
    lines.push("| Address | R/W | Arguments | Description |");
    lines.push("|---------|-----|-----------|-------------|");
    for (const e of groupEntries) {
      const rw = [e.readable ? "R" : "", e.writable ? "W" : ""].filter(Boolean).join("/");
      const args = e.setArgs.length
        ? e.setArgs.map(a => `${a.type} \`${a.name}\`${a.unit ? ` ${a.unit}` : ""}${a.min !== undefined ? ` (${a.min}–${a.max})` : ""}`).join(", ")
        : "";
      lines.push(`| \`${e.address}\` | ${rw} | ${args} | ${e.description} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
