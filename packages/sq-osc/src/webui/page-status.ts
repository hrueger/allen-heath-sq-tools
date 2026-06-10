export interface BridgeStatus {
  connected: boolean;
  mixerHost: string | null;
  version: string | null;
  oscInPort: number;
  oscOutPort: number;
  webUiPort: number;
}

export function renderStatusPage(status: BridgeStatus): string {
  const dotColor = status.connected ? "#34d399" : "#f87171";
  const dotLabel = status.connected ? "Connected" : "Connecting…";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SQ OSC Bridge</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#1a1a2e;color:#e0e0e0;padding:2rem}
  h1{font-size:1.5rem;font-weight:700;color:#a78bfa;margin-bottom:.25rem}
  .subtitle{color:#9ca3af;font-size:.875rem;margin-bottom:2rem}
  nav{display:flex;gap:1rem;margin-bottom:2rem}
  nav a{color:#a78bfa;text-decoration:none;font-size:.875rem;padding:.4rem .8rem;border-radius:.375rem;background:#2d2d4e}
  nav a:hover{background:#3d3d6e}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;max-width:800px}
  .card{background:#16213e;border:1px solid #2d2d4e;border-radius:.75rem;padding:1.25rem}
  .card-label{font-size:.75rem;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem}
  .card-value{font-size:1.125rem;font-weight:600;color:#e0e0e0}
  .status-dot{display:inline-block;width:.6rem;height:.6rem;border-radius:50%;margin-right:.5rem;background:${dotColor}}
  .blink{animation:blink 1.2s step-end infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  code{background:#0f3460;padding:.15em .45em;border-radius:.25rem;font-size:.9em}
</style>
</head>
<body>
<h1>SQ OSC Bridge</h1>
<p class="subtitle">Allen &amp; Heath SQ mixer ↔ OSC bridge</p>
<nav>
  <a href="/">Status</a>
  <a href="/config">Config</a>
  <a href="/docs">OSC Reference</a>
</nav>
<div class="cards" id="cards">
  <div class="card">
    <div class="card-label">Mixer</div>
    <div class="card-value" id="mixer-status">
      <span class="status-dot${status.connected ? "" : " blink"}"></span>${dotLabel}
    </div>
  </div>
  <div class="card">
    <div class="card-label">Mixer address</div>
    <div class="card-value"><code>${status.mixerHost ?? "auto-discover"}</code></div>
  </div>
  <div class="card">
    <div class="card-label">Firmware</div>
    <div class="card-value" id="version">${status.version ?? "—"}</div>
  </div>
  <div class="card">
    <div class="card-label">OSC in (receive)</div>
    <div class="card-value"><code>:${status.oscInPort}</code></div>
  </div>
  <div class="card">
    <div class="card-label">OSC out (feedback)</div>
    <div class="card-value"><code>:${status.oscOutPort}</code></div>
  </div>
</div>
<script>
const es = new EventSource('/status/events');
es.onmessage = function(e) {
  const d = JSON.parse(e.data);
  const dot = document.querySelector('.status-dot');
  if (dot) {
    dot.style.background = d.connected ? '#34d399' : '#f87171';
    dot.className = 'status-dot' + (d.connected ? '' : ' blink');
  }
  const ms = document.getElementById('mixer-status');
  if (ms) ms.innerHTML = '<span class="status-dot' + (d.connected ? '' : ' blink') +
    '" style="background:' + (d.connected ? '#34d399' : '#f87171') + '"></span>' +
    (d.connected ? 'Connected' : 'Connecting…');
  const v = document.getElementById('version');
  if (v) v.textContent = d.version || '—';
};
</script>
</body>
</html>`;
}
