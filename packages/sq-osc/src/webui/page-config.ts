import type { BridgeConfig } from "../config.ts";

export function renderConfigPage(config: BridgeConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SQ OSC Bridge — Config</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;padding:2rem}
  h1{font-size:1.5rem;font-weight:700;color:#a78bfa;margin-bottom:.25rem}
  .subtitle{color:#9ca3af;font-size:.875rem;margin-bottom:2rem}
  nav{display:flex;gap:1rem;margin-bottom:2rem}
  nav a{color:#a78bfa;text-decoration:none;font-size:.875rem;padding:.4rem .8rem;border-radius:.375rem;background:#2d2d4e}
  nav a:hover{background:#3d3d6e}
  .card{background:#16213e;border:1px solid #2d2d4e;border-radius:.75rem;padding:1.5rem;max-width:540px}
  label{display:block;font-size:.8125rem;color:#9ca3af;margin-bottom:.25rem;margin-top:1rem}
  label:first-child{margin-top:0}
  input,select{width:100%;padding:.5rem .75rem;background:#0f3460;border:1px solid #3d3d6e;border-radius:.375rem;color:#e0e0e0;font-size:.9375rem;outline:none}
  input:focus,select:focus{border-color:#a78bfa}
  .hint{font-size:.75rem;color:#6b7280;margin-top:.25rem}
  .row{display:flex;gap:.75rem}
  .row>div{flex:1}
  button[type=submit]{margin-top:1.5rem;width:100%;padding:.625rem;background:#7c3aed;border:none;border-radius:.375rem;color:#fff;font-size:.9375rem;font-weight:600;cursor:pointer}
  button[type=submit]:hover{background:#6d28d9}
  .saved{display:none;margin-top:.75rem;color:#34d399;font-size:.875rem;text-align:center}
</style>
</head>
<body>
<h1>SQ OSC Bridge</h1>
<p class="subtitle">Configure the bridge, then save. Changes take effect immediately.</p>
<nav>
  <a href="/">Status</a>
  <a href="/config">Config</a>
  <a href="/docs">OSC Reference</a>
</nav>
<div class="card">
  <form method="POST" action="/config">
    <label>Mixer IP address</label>
    <input name="mixerHost" type="text" placeholder="Leave blank to auto-discover"
      value="${config.mixerHost ?? ""}">
    <p class="hint">Leave blank to automatically find your SQ mixer on the network.</p>

    <div class="row">
      <div>
        <label>OSC receive port</label>
        <input name="oscInPort" type="number" min="1" max="65535" value="${config.oscInPort}">
        <p class="hint">Port this bridge listens on for incoming OSC messages.</p>
      </div>
      <div>
        <label>OSC send port</label>
        <input name="oscOutPort" type="number" min="1" max="65535" value="${config.oscOutPort}">
        <p class="hint">Port used for outgoing feedback messages.</p>
      </div>
    </div>

    <label>OSC target IP</label>
    <input name="oscTargetHost" type="text" placeholder="Leave blank to broadcast"
      value="${config.oscTargetHost ?? ""}">
    <p class="hint">Specific IP for feedback (e.g. TouchOSC device). Leave blank to broadcast to the whole subnet.</p>

    <label>Web UI port</label>
    <input name="webUiPort" type="number" min="1" max="65535" value="${config.webUiPort}">

    <button type="submit">Save &amp; Reconnect</button>
    <p class="saved" id="saved">Saved!</p>
  </form>
</div>
</body>
</html>`;
}
