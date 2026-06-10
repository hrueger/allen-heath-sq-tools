# @allen-heath-sq-tools/api

[![npm](https://img.shields.io/npm/v/@allen-heath-sq-tools/api)](https://www.npmjs.com/package/@allen-heath-sq-tools/api)
[![CI](https://github.com/hrueger/allen-heath-sq-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/hrueger/allen-heath-sq-tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

TypeScript/Node.js API for Allen & Heath SQ digital mixing consoles. Controls the mixer over the network using the same binary protocol as MixPad.

## Install

```sh
npm install @allen-heath-sq-tools/api
```

## Quick start

```ts
import { SQMixer } from "@allen-heath-sq-tools/api";

const sq = new SQMixer({ host: "10.22.1.11" });
await sq.connect();

sq.inputs[0].setLevel(0.8);   // fader to 0 dB
sq.inputs[0].setMute(false);
sq.buses[0].setLevel(0.6);
sq.mainLR.setMute(false);

sq.disconnect();
```

## Connecting

```ts
const sq = new SQMixer({ host: "10.22.1.11" });

// connect() resolves with firmware version info
const { fwA, fwB, model } = await sq.connect();

// Auto-discover the mixer on the local network instead of specifying host
const sq = new SQMixer({ host: "auto" });
await sq.connect(); // broadcasts and connects to the first SQ found
```

## Channel access

| Property | Type | Contents |
|---|---|---|
| `sq.inputs` | `InputChannel[48]` | Input channels 1–48 |
| `sq.stereoInputs` | `StereoInput[3]` | Stereo inputs 1–3 |
| `sq.fxReturns` | `FxReturn[4]` | FX returns 1–4 |
| `sq.buses` | `MixBus[12]` | Mix buses 1–12 |
| `sq.dcas` | `DcaGroup[8]` | DCA groups 1–8 |
| `sq.mainLR` | `MainLR` | Main LR |

All channels are zero-indexed: `sq.inputs[0]` = Input 1, `sq.buses[0]` = Bus 1.

## Channel methods

All setters take human-readable values and handle the wire encoding internally.

**Fader & routing**
```ts
ch.setLevel(value)          // fader position 0.0–1.0  (use dbToFader/faderToDb to convert)
ch.setMute(on)
ch.setPan(value)            // -1.0 full left … 0 centre … +1.0 full right
ch.setSend(busNumber, value)   // send level to mix bus 1–12, value 0.0–1.0
ch.setSendFx(fxNumber, value)  // send level to FX bus 1–4
ch.setPaflOn(on)            // solo / PAFL
ch.setDirectOut(outNumber | null)  // assign to direct out, or null to clear
ch.setInsertEnabled(on)
```

**Preamp** *(InputChannel only)*
```ts
ch.setGain(dB)              // preamp gain
ch.setTrim(dB)              // trim -24 dB … +24 dB
ch.setPadOn(on)
ch.setPhantomOn(on)         // 48V phantom power
ch.setPolarityOn(on)        // polarity flip
ch.setDelayOn(on)
ch.setDelayDuration(ms)
```

**Name & colour** *(InputChannel only)*
```ts
ch.setName(name)            // max 6 characters
ch.setColor(r, g, b)        // RGB 0–255
ch.setColorTransparent()
// or use the ChannelColor enum:
import { ChannelColor } from "@allen-heath-sq-tools/api";
ch.setColor(...ChannelColor.Red);
```

**HPF** *(InputChannel only)*
```ts
ch.setHpfOn(on)
ch.setHpfFreq(hz)           // 20 Hz – 2 kHz
ch.setHpfSlope(dbPerOctave) // 12 | 18 | 24
```

**Gate** *(InputChannel only)*
```ts
ch.setGateOn(on)
ch.setGateThreshold(dB)
ch.setGateDepth(dB)
ch.setGateAttack(ms)
ch.setGateRelease(ms)
ch.setGateHold(ms)
```

**Compressor** *(InputChannel only)*
```ts
ch.setCompOn(on)
ch.setCompThreshold(dB)
ch.setCompRatio(ratio)      // e.g. 4 for 4:1
ch.setCompGain(dB)
```

**PEQ** *(InputChannel only)*
```ts
ch.setPeqOn(on)
// Four bands: Lf, Lm, Hm, Hf
ch.setPeqLfGain(dB)   ch.setPeqLfFreq(hz)   ch.setPeqLfQ(q)   ch.setPeqLfShape(n)
ch.setPeqLmGain(dB)   ch.setPeqLmFreq(hz)   ch.setPeqLmQ(q)
ch.setPeqHmGain(dB)   ch.setPeqHmFreq(hz)   ch.setPeqHmQ(q)
ch.setPeqHfGain(dB)   ch.setPeqHfFreq(hz)   ch.setPeqHfQ(q)   ch.setPeqHfShape(n)
```

## Reading state

Parameter values are cached after the first update from the mixer:

```ts
console.log(ch.level);       // number | null
console.log(ch.muted);       // boolean | null
console.log(ch.gain);        // dB | null
```

Values are `null` until the mixer sends the first change for that parameter.

## Events

Channels and the mixer are `EventEmitter`s. Subscribe to be notified of changes — whether triggered by your code, MixPad, or the physical console.

```ts
// Channel events
ch.on("level",          (value: number) => {})
ch.on("mute",           (on: boolean) => {})
ch.on("pan",            (value: number) => {})
ch.on("gain",           (dB: number) => {})
ch.on("send",           (busNumber: number, value: number) => {})
ch.on("gate-on",        (on: boolean) => {})
ch.on("comp-threshold", (dB: number) => {})
// ... all setter names have a matching event

// Mixer events
sq.on("connect",      (info: VersionInfo) => {})
sq.on("disconnect",   () => {})
sq.on("error",        (e: Error) => {})
sq.on("mute-group",   (groupNumber: number, on: boolean) => {})
sq.on("scene-recall", (sceneNumber: number) => {})
sq.on("scene-delete", (sceneNumber: number) => {})
sq.on("scene-name",   (sceneNumber: number, name: string) => {})
sq.on("initialState", () => {})  // fires once on connect when full state is loaded
```

## Scenes & mute groups

```ts
sq.recallScene(sceneNumber)              // 1-based
sq.storeScene(sceneNumber)
sq.deleteScene(sceneNumber)
sq.renameScene(sceneNumber, name)        // max 16 characters
sq.setSceneCrossfadeMs(sceneNumber, ms)  // 0 = off

sq.sceneNames[0]                         // name of scene 1, or null if empty

sq.setMuteGroupOn(groupNumber, on)       // groupNumber 1–8
```

## Discovery

```ts
import { discover } from "@allen-heath-sq-tools/api";

const mixer = await discover("SQ", 2000); // timeout ms
console.log(mixer.name, mixer.address);
```

## dB ↔ fader conversion

```ts
import { dbToFader, faderToDb } from "@allen-heath-sq-tools/api";

ch.setLevel(dbToFader(0));    // 0 dB
console.log(faderToDb(ch.level ?? 0));
```

## Examples

See the [`examples/`](examples/) folder:

| File | What it shows |
|---|---|
| `api-demo.ts` | Basic connect, fader, mute, direct out |
| `comprehensive-demo.ts` | Full channel strip walkthrough |
| `sine-wave-demo.ts` | Animated fader sweep |
| `events.ts` | Subscribing to live parameter changes |
| `scenes.ts` | Scene recall, store, delete |
| `rainbow-lcd.ts` | Animated channel colours across 16 inputs |
| `watch.ts` | Low-level frame monitor (move anything on the console to see it) |

Run any example directly:

```sh
npx ts-node examples/api-demo.ts
```

## Low-level access

The `Connection` class gives direct access to the raw frame stream for protocol exploration:

```ts
import { Connection } from "@allen-heath-sq-tools/api";

const conn = new Connection({ host: "10.22.1.11" });
conn.on("dsp", (frame) => console.log(frame));
conn.on("frame", (frame) => console.log(frame));
await conn.connect();
```
