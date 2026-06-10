# sq-osc

[![release](https://img.shields.io/github/v/release/hrueger/allen-heath-sq-tools?filter=sq-osc-v*&label=release)](https://github.com/hrueger/allen-heath-sq-tools/releases?q=sq-osc-v)
[![CI](https://github.com/hrueger/allen-heath-sq-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/hrueger/allen-heath-sq-tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

OSC bridge for Allen & Heath SQ mixing consoles. Exposes every mixer parameter over OSC with full bidirectional support — set values, query current state, and receive live feedback as the mixer changes.

Runs as a single executable with an embedded web UI for configuration. No Node.js, npm, or technical knowledge required to run it.

## Quick start

1. **Download** `sq-osc` from [Releases](../../releases) and make it executable:
   ```sh
   chmod +x sq-osc   # macOS / Linux
   ```

2. **Run it:**
   ```sh
   ./sq-osc
   ```

3. A browser window opens automatically at `http://localhost:3000`. The bridge auto-discovers your SQ mixer on the local network. Once connected, start sending OSC messages.

> **Tip:** Point your OSC controller (TouchOSC, QLab, Reaper, etc.) to UDP port `8000` on the bridge machine. Set your controller's feedback port to `9000`.

## Configuration

The web UI at `http://localhost:3000/config` lets you set:

| Setting | Default | Description |
|---|---|---|
| Mixer IP | *(auto-discover)* | Leave blank to find your SQ automatically, or enter a fixed IP |
| OSC receive port | `8000` | Port the bridge listens on for incoming OSC messages |
| OSC send port | `9000` | Port used for outgoing feedback messages |
| OSC target IP | *(broadcast)* | Specific IP for feedback (e.g. your TouchOSC device). Leave blank to broadcast |
| Web UI port | `3000` | Port for this interface |

Settings are saved to `~/.config/sq-osc/config.json` and persist across restarts.

### CLI flags

Flags override the saved config for the current session only:

```sh
./sq-osc --mixer-ip 10.22.1.11 --osc-in 8000 --osc-out 9000 --web-port 3000 --no-browser
```

## OSC protocol

### SET — change a value

Send an OSC message to the address with the appropriate argument:

```
/input/1/fader  f 0.75       → set input 1 fader to 0.75 (≈ 0 dB)
/input/1/mute   i 1          → mute input 1
/bus/3/fader    f 0.5        → set bus 3 fader to –10 dB
/scene/5/recall              → recall scene 5
/mute-group/2   i 1          → activate mute group 2
```

### GET — query the current value

Send the address with **no arguments**. The bridge replies to your IP and port with the current value:

```
/input/1/fader    →  /input/1/fader  f 0.75
/input/1/mute     →  /input/1/mute   i 1
/bridge/status    →  /bridge/status  s "connected"
```

### Feedback — live updates

The bridge broadcasts an OSC message whenever a parameter changes on the mixer (whether via OSC, MixPad, or the physical console). Subscribe to any address by listening on your configured feedback port.

## OSC address reference

The complete reference is in **[OSC-REFERENCE.md](OSC-REFERENCE.md)** — auto-generated from the registry every time you run `deno task bundle`. The live bridge also serves it as HTML at `http://localhost:3000/docs` and as a downloadable file at `http://localhost:3000/docs/osc-reference.md`.

### Address structure

| Prefix | Channel type | Index range |
|---|---|---|
| `/input/{n}/…` | Input channels | 1–48 |
| `/stereo/{n}/…` | Stereo inputs | 1–3 |
| `/fxreturn/{n}/…` | FX returns | 1–4 |
| `/bus/{n}/…` | Mix buses | 1–12 |
| `/dca/{n}/…` | DCA groups | 1–8 |
| `/main/…` | Main L/R | — |

### Common channel parameters

```
{prefix}/fader          f  0.0–1.0    fader position (0 = off, 1 = +10 dB)
{prefix}/fader/db       f  dB         fader in dB (read-only, query only)
{prefix}/mute           i  0|1
{prefix}/pan            f  -1.0–1.0   -1=full left, 0=centre, +1=full right
{prefix}/name           s             channel name (max 6 chars)
{prefix}/gain           f  0–60 dB    preamp gain (inputs only)
{prefix}/phantom        i  0|1        48V phantom power (inputs only)
{prefix}/pad            i  0|1
{prefix}/hpf/on         i  0|1
{prefix}/hpf/freq       f  20–2000 Hz
{prefix}/gate/on        i  0|1
{prefix}/gate/threshold f  dB
{prefix}/comp/on        i  0|1
{prefix}/comp/threshold f  dB
{prefix}/comp/ratio     f
{prefix}/peq/on         i  0|1
{prefix}/peq/lf/gain    f  dB
{prefix}/peq/lf/freq    f  Hz
{prefix}/delay/on       i  0|1
{prefix}/delay/time     f  0–341 ms
{prefix}/send/{b}       f  0.0–1.0    send level to bus b (1–12)
{prefix}/sendfx/{x}     f  0.0–1.0    send level to FX x (1–4)
{prefix}/pafl           i  0|1        solo
```

### Global addresses

```
/mute-group/{n}          i  0|1      mute group on/off, n=1–8
/scene/{n}/recall                    recall scene n
/scene/{n}/store                     store current state to scene n
/scene/{n}/delete                    delete scene n
/scene/{n}/rename         s          rename scene n
/scene/{n}/name           s          read scene name (read-only)
/scene/{n}/crossfade      f  ms      per-scene crossfade time
/talkback/on              i  0|1
/talkback/gain            f  -20–40 dB
/directout/tappoint       i  0–6
/bridge/status            (no args)  query: replies "connected" or "disconnected"
```

## Building from source

Requires [Deno](https://deno.com) 2.x.

```sh
# From the repo root
npm run build:osc                 # macOS/Linux binary → dist/sq-osc
npm run build:osc:windows         # Windows → dist/sq-osc-windows.exe
npm run build:osc:linux           # Linux x86-64 → dist/sq-osc-linux

# Or from packages/sq-osc directly
deno task bundle
deno task start                   # run without compiling (development)
```
