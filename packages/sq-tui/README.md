# @allen-heath-sq-tools/tui

[![npm](https://img.shields.io/npm/v/@allen-heath-sq-tools/tui)](https://www.npmjs.com/package/@allen-heath-sq-tools/tui)
[![CI](https://github.com/hrueger/allen-heath-sq-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/hrueger/allen-heath-sq-tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

Terminal UI for Allen & Heath SQ mixing consoles. Built with [Ink](https://github.com/vadimdemedes/ink) (React for the terminal).

## Usage

```sh
SQ_HOST=10.22.1.11 npm start
```

The default host is `10.22.1.11`. Set `SQ_HOST` to point at your mixer.

## Layout

```
┌───────────────────────────────────────────────────────────┐
│ SQ MIXER  1:INPUTS  2:STEREO  3:FX RET  4:BUSES  5:DCAS   │  ← header / nav
│                                                           │
│  CH LIST  │  DETAIL PANEL                                 │  ← main area
│           │                                               │
│           │  Fader / Preamp / HPF / Gate / Comp /         │
│           │  Delay / PEQ / Routing / Sends                │
│                                                           │
│ event log                                                 │  ← last 3 events
└───────────────────────────────────────────────────────────┘
```

## Keyboard

| Key            | Action                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| `1` – `6`      | Switch channel type: Inputs / Stereo / FX Returns / Buses / DCAs / Main LR |
| `↑` / `↓`      | Navigate channel list or parameter rows                                    |
| `Tab`          | Move focus between channel list and detail panel                           |
| `Enter`        | Enter edit mode for the focused parameter                                  |
| `Esc`          | Exit edit mode / go back to channel list                                   |
| `m`            | Open mixer page (scenes, mute groups, talkback)                            |
| `q` / `Ctrl+C` | Quit                                                                       |

## Detail sections

Each input channel exposes these sections, cycled through with `Tab` while the detail panel is focused:

- **Fader** — level (dB), mute, pan, PAFL
- **Preamp** — gain, trim, pad, phantom, polarity
- **HPF** — on/off, frequency, slope
- **Gate** — on/off, threshold, depth, attack, release, hold
- **Comp** — on/off, threshold, ratio, gain
- **Delay** — on/off, duration
- **PEQ** — 4-band parametric EQ (LF, LM, HM, HF)
- **Routing** — direct out, inserts
- **Sends** — levels to all 12 mix buses and 4 FX buses
