# SQ API — Feature Inventory

## Implementation Matrix

| Feature | Send | Query | Subscribe | Status | Note |
|---------|------|-------|-----------|--------|------|
| **Fader Level** | ✅ | ✅ | ✅ | Done | `setLevel()`, `channel.level`, `on('level')` |
| **Mute** | ✅ | ✅ | ✅ | Done | `setMute()`, `channel.muted`, `on('mute')` |
| **Stereo Input** | ✅ | ✅ | ✅ | Partial | Fader/mute work; addressing not field-tested |
| **FX Return** | ✅ | ✅ | ✅ | Confirmed | Uses standard fader/mute registers at 0x40–0x43 |
| **DCA Group** | ✅ | ✅ | ✅ | Confirmed | Uses dedicated registers 0x1e (fader) and 0x1c (mute), group ID at position [4] |
| **Pan** | ✅ | ✅ | ✅ | Done | `setPan()`, `channel.pan`, `on('pan')` |
| **Send Level (Bus)** | ✅ | ✅ | ✅ | Done | `setSend(bus,level)`, `channel.sends[bus]`, `on('send',bus,level)` |
| **Send Level (FX)** | ✅ | ✅ | ✅ | Confirmed | `setSendFx(fxNum,level)`, `channel.fxSends[fxNum]`, `on('send-fx',fxNum,level)` |
| **Input Gain** | ✅ | ✅ | ✅ | Done | `setGain()`, `channel.gain`, `on('gain')` |
| **Trim** | ✅ | ✅ | ✅ | Done | `setTrim()`, `channel.trim`, `on('trim')` |
| **Pad** | ✅ | ✅ | ✅ | Done | `setPadOn()`, `channel.padOn`, `on('pad-on')` |
| **48V Phantom** | ✅ | ✅ | ✅ | Done | `setPhantomOn()`, `channel.phantomOn`, `on('phantom-on')` |
| **Polarity** | ✅ | ✅ | ✅ | Done | `setPolarityOn()`, `channel.polarityOn`, `on('polarity-on')` |
| **Delay On/Off** | ✅ | ✅ | ✅ | Done | `setDelayOn()`, `channel.delayOn`, `on('delay-on')` |
| **Delay Duration** | ✅ | ✅ | ✅ | Done | `setDelayDuration()`, `channel.delayDuration`, `on('delay-duration')` |
| **HPF** | ✅ | ✅ | ✅ | Done | `setHpfOn()`, `setHpfFreq()`, `setHpfSlope()`, `channel.hpfOn`, `channel.hpfFreq`, `channel.hpfSlope`, `on('hpf-*')` |
| **Gate** | ✅ | ✅ | ✅ | Done | `setGateOn()`, `setGateThreshold()`, `setGateDepth()`, `setGateAttack()`, `setGateRelease()`, `setGateHold()` |
| **Compressor** | ✅ | ✅ | ✅ | Done | `setCompOn()`, `setCompThreshold()`, `setCompRatio()`, `setCompGain()`, `channel.comp{On,Threshold,Ratio,Gain}`, `on('comp-*')` |
| **Inserts** | ✅ | ✅ | ✅ | Confirmed | `setInsertEnabled(bool)`, `channel.insertEnabled`, `on('insert-enabled')` |
| **Direct Out** | ✅ | ✅ | ✅ | Done | `setDirectOut()`, `channel.directOut`, `on('direct-out')` |
| **Direct Out Level** | ✅ | ✅ | ✅ | Done | `setDirectOutLevel()` |
| **Direct Out Config** | ✅ | ✅ | ✅ | Done | `setDirectOutTapPoint()`, `setDirectOutFollow{Fader,Mute,DCAFader,DCAMute,MuteGroup}()` |
| **PEQ** | ✅ | ✅ | ✅ | Confirmed | 4 bands (LF, LM, HM, HF): `setPeqOn()`, LF/HF with shape, LM/HM without; `setPeqLfFreq()`, `setPeqLmGain()`, `setPeqHmQ()`, `setPeqHfShape()`, etc. |
| **Metering** | ❌ | ❌ | ⚠️ | UDP Only | UDP meter data received; format TBD |
| **Mute Groups** | ✅ | ✅ | ✅ | Done | `setMuteGroupOn(num,on)`, `mixer.muteGroups[num-1]`, `on('mute-group',num,on)` |
| **Scene Recall** | ✅ | — | ✅ | Done | `recallScene(num)`, `on('scene-recall', num)` — fires when mixer sends recall-complete (reg 0x1c) |
| **Scene Store** | ✅ | — | — | Done | `storeScene(num)` — two-frame protocol confirmed |
| **Scene Delete** | ✅ | — | ✅ | Done | `deleteScene(num)`, `on('scene-delete', num)` |
| **Scene Crossfade** | ✅ | — | — | Done | `setSceneCrossfadeMs(num, ms)` — per-scene, cached in `mixer.sceneCrossfadeMs[sceneId]` |
| **Scene Rename** | ✅ | — | ✅ | Done | `renameScene(num, name)` — sub=0x08 ChannelInfo frame; `mixer.sceneNames[sceneId]`, `on('scene-name', num, name)` |
| **Fader Layer Config** | ❌ | ❌ | ❌ | Console Only | Layer A–F channel assignments not writable over the network; no traffic observed in MixPad captures |
| **IP Patching** | ✅ | ❌ | ❌ | Done | `setInputPatch(source,ch,destB3)`, `setOutputPatch(srcB3,dest,ch)`, `setOutputPatchFxReturn(n,L/R,dest,ch)`, `setOutputPatchMonitor(src,dest,ch)` |
| **Monitor PAFL** | ✅ | ✅ | ✅ | Confirmed | `setPaflOn(bool)`, `channel.paflOn`, `on('pafl-on')` |
| **Monitor LR** | ❌ | ❌ | ❌ | Hardware Only | Physical potentiometer on console; not exposed over the network |
| **Talkback** | ✅ | ✅ | ✅ | Confirmed | Complete: on/off, source, gain, phantom, pad, HPF, trim, momentary/latch, routing to groups/aux/matrix/MainLR |
| **Channel Name** | ✅ | ✅ | ✅ | Done | `setName()` (max 6 chars) |
| **Channel Color** | ✅ | ✅ | ✅ | Done | `setColor(r,g,b)`, `setColorTransparent()`, enum ChannelColor |

## Query & Subscribe Infrastructure

### Current State
- **Live updates**: ✅ DSP frames (0xF7) arrive when values change; `channel.level` and `channel.muted` cache is updated and `'level'`/`'mute'` events are emitted
- **State cache**: ✅ `channel.level: number | null`, `channel.muted: boolean | null` — readable directly, `null` until first DSP update
- **Initial state on connect**: ❌ `null` until a physical or remote change triggers a DSP update

### Initial State

After subscription the mixer sends several frame types. The scene list is fetched via a DSP read request:

| Frame | Subtype | Size | Contents | Status |
|-------|---------|------|----------|--------|
| FullState | 0x0E | 8200 bytes | Parameter address table (20-byte records). Does **not** contain parameter values. | Received, not parsed |
| ParamData | 0x04 | ~97 KB | All current parameter values. Scene names are **not** in this blob. | Received, partially parsed |
| ChannelInfo | 0x08 | 5407 bytes | Scene list: 300 records × 18 bytes (`[flag:1][name:16][pad:1]`). flag=0x07=stored, flag=0x00=empty. | ✅ Parsed |
| ChannelInfo | 0x08 | 10247–2207 bytes | FX/routing library names. | Received, not parsed |
| ChannelInfo | 0x08 | 55–159 bytes | Periodic metering data (~1 Hz). | Ignored |

#### Scene-list DSP Read Protocol

The mixer only sends the 5407-byte scene-list ChannelInfo when asked. The SDK sends this DSP read request ~40ms after SubExtra3 (matching MixPad's behaviour):

```
f7 02 02 20 ff ff ff ff
   ^^ ^^ ^^             ch1=ch2=0x02 (scene category), reg=0x20
            ^^^^^^^^^^^ val=0xffffffff = "send full dump"
```

The mixer responds with a ChannelInfo frame whose payload starts with `02 02 21 00 00 00 00` (header, 7 bytes), followed by 300 × 18-byte records. Other large ChannelInfo blocks (FX library, etc.) are triggered by similar DSP read requests with different ch/reg values (e.g. `f7 04 04 25 ff ff ff ff` for the 10247-byte FX block).

## Address Space Reference

| Range | Device | Count | Status |
|-------|--------|-------|--------|
| 0x00–0x2f | Input channels 1–48 | 48 | ✅ Confirmed |
| 0x30–0x32 | Stereo inputs 1–3 | 3 | ⚠️ Inferred |
| 0x40–0x43 | FX returns 1–4 | 4 | ✅ Confirmed |
| 0x58–0x63 | Mix buses 1–12 | 12 | ✅ Confirmed |
| 0x68 | Main LR | 1 | ✅ Confirmed |
| **DCA groups 1–8** | **Global protocol** | 8 | ✅ Confirmed |

## Register Reference (Confirmed)

| Register | Purpose | Wire format (bytes 0–7 of DSP frame) |
|----------|---------|--------------------------------------|
| 0x0c (cat 0x07) | Mute | `F7 07 07 0c [b3] 00 [val_lo] [val_hi]` — val: 0x0001=mute, 0x0000=unmute |
| 0x0e (mod 0x20) | Fader level | `F7 07 07 0e [b3] 20 [val_lo] [val_hi]` — val: 16-bit LE, ~0x7f9d = 0 dB |
| 0x0e (mod 0x10-1b) | Send Level (Bus) | `F7 09 07 0e [b3] [bus_id] [val_lo] [val_hi]` — bus_id: 0x10=Bus1...0x1b=Bus12, val: 0=off, 35328=0dB |
| 0x0e (mod 0x23-26) | Send Level (FX) | `F7 09 07 0e [b3] [fx_id] [val_lo] [val_hi]` — fx_id: 0x23=FX1...0x26=FX4, val: 0=off, 35328=0dB |
| 0x10 | Pan | `F7 08 07 10 [b3] 20 [val_lo] 00` — val: 0x00=full left, 0x25≈center, 0x4a=full right (byte value) |
| 0x0c (cat 0x0c) | Input Gain | `F7 08 0c 0c [b3] 01 [val_lo] [val_hi]` — val: 16-bit LE, 0x8000=0dB, 0xbc00=+60dB (256 values/dB) |
| 0x0d (cat 0x0c) | Phantom Power | `F7 38 0c 0d [b3] 01 [val_lo] [val_hi]` — val: 0x0001=on, 0x0000=off |
| 0x0e (cat 0x0c) | Pad On/Off | `F7 38 0c 0e [b3] 01 [val_lo] [val_hi]` — val: 0x0001=on, 0x0000=off |
| 0x0f (cat 0x0c) | Trim | `F7 38 0c 0f [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, 26624=-24dB, 36824=+24dB (212.5 values/dB) |
| 0x10 (cat 0x0c) | Polarity | `F7 38 0c 10 [b3] 00 [val_lo] [val_hi]` — val: 0x0001=on (flip), 0x0000=off (normal) |
| 0x0c (cat 0x14) | Delay On/Off | `F7 38 14 0C [b3] 00 [val_lo] [val_hi]` — val: 0x0001=on, 0x0000=off |
| 0x0d (cat 0x14) | Delay Duration | `F7 38 14 0D [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, 0–341ms (~3.02 units/ms, range 5–1035) |
| 0x0c (cat 0x0e) | HPF On/Off | `F7 08 0e 0c [b3] 00 [val_lo] [val_hi]` — val: 0x0000=off, 0x0001=on |
| 0x0d (cat 0x0e) | HPF Frequency | `F7 08 0e 0d [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, log scale 20Hz-2kHz (wireVal = -9206 + 15308×log₁₀(Hz)) |
| 0x0e (cat 0x0e) | HPF Slope | `F7 38 0e 0e [b3] 00 [val_lo] [val_hi]` — val: 1=12dB/oct, 2=18dB/oct, 3=24dB/oct |
| 0x0c (cat 0x0f) | Gate On/Off | `F7 08 0F 0C [b3] 00 [val_lo] [val_hi]` — val: 0x0001=on, 0x0000=off |
| 0x0e (cat 0x0f) | Gate Threshold | `F7 08 0F 0E [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, 0x8000=0dB, 256 values/dB |
| 0x0f (cat 0x0f) | Gate Depth | `F7 38 0F 0F [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, 0x8000=0dB, 256 values/dB |
| 0x10 (cat 0x0f) | Gate Attack | `F7 38 0F 10 [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, exponential 0.05ms-300ms |
| 0x11 (cat 0x0f) | Gate Release | `F7 38 0F 11 [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, exponential 10ms-1s |
| 0x12 (cat 0x0f) | Gate Hold | `F7 38 0F 12 [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, exponential 10ms-5s |
| 0x0c (cat 0x13) | Compressor On/Off | `F7 08 13 0C [b3] 00 [val_lo] [val_hi]` — val: 0x0001=on, 0x0000=off |
| 0x0e (cat 0x13) | Compressor Threshold | `F7 38 13 0E [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, range 33751 (-46dB) to 37347 (+18dB), ~56 values/dB |
| 0x0f (cat 0x13) | Compressor Ratio | `F7 38 13 0F [b3] 00 [val_lo] [val_hi]` — val: discrete 1:1 to ∞ (wire values 39→11) |
| 0x10 (cat 0x13) | Compressor Gain | `F7 38 13 10 [b3] 00 [val_lo] [val_hi]` — val: 16-bit LE, range 33536 (0dB) to 36800 (+18dB), ~181 values/dB |
| 0x1a | Mute Group Toggle | `F7 07 07 1a [group_id] 00 [val_lo] [val_hi]` — [group_id]: 0x00-0x07 for groups 1-8, val: 0x0001=on, 0x0000=off |
| 0x1c | DCA Mute | `F7 07 07 1c [dca_id] 00 [val_lo] [val_hi]` — [dca_id]: 0x00-0x07 for DCA 1-8, val: 0x0001=mute, 0x0000=unmute |
| 0x1e | DCA Fader | `F7 07 07 1e [dca_id] 00 [val_lo] [val_hi]` — [dca_id]: 0x00-0x07 for DCA 1-8, val: 16-bit LE, ~0x7f9d = 0 dB |
| 0x0c (cat 0x38) | Insert Enable | `F7 38 10 0c [insert_id] 00 [val_lo] [val_hi]` — [insert_id]: 0x00-0x2f for Insert on channels 1-48, val: 0x0001=on, 0x0000=off |
| 0x0c (cat 0x08) | PAFL (Solo) | `F7 08 15 0c [b3] 00 [val_lo] [val_hi]` — [b3]: channel address, val: 0x0001=on, 0x0000=off |
| 0x1a (cat 0x38, sub 0x11) | PEQ On/Off | `F7 38 11 1a [b3] 00 [val_lo] [val_hi]` — Global PEQ enable, val: 0x0001=on, 0x0000=off |
| 0x0c–0x0f (cat 0x38, sub 0x11) | PEQ LF Band | 0x0c=gain, 0x0d=freq, 0x0e=Q, 0x0f=shape(0=Peak, 6=Low Shelf, 11=High Pass) |
| 0x10–0x12 (cat 0x38, sub 0x11) | PEQ LM Band | 0x10=gain, 0x11=freq, 0x12=Q (no shape) |
| 0x13–0x15 (cat 0x38, sub 0x11) | PEQ HM Band | 0x13=gain, 0x14=freq, 0x15=Q (no shape) |
| 0x16–0x19 (cat 0x38, sub 0x11) | PEQ HF Band | 0x16=gain, 0x17=freq, 0x18=Q, 0x19=shape(0=Peak, 6=Low Shelf, 11=High Pass) |
| All PEQ params | Gain encoding | dB value, range -15dB to +15dB, same as comp threshold |
| All PEQ params | Frequency encoding | Log scale 20Hz–20kHz, wireVal = -9206 + 15308×log₁₀(Hz) |
| All PEQ params | Q encoding | Range 0.1–2.0, wireVal = round(Q × 8) |
| 0x0d (cat 0x38, sub 0x0b) | Talkback Source | `F7 38 0b 0d 00 [sourceId] 00 2a` — sourceId: 0x01-0x10=Ch1-16, 0x11-0x16=Stereo Inputs, 0x00=Talk |
| 0x10 (cat 0x08, sub 0x0b) | Talkback On/Off | `F7 08 0b 10 00 00 [val_lo] [val_hi]` — val: 0x0001=on, 0x0000=off (push-to-talk when enabled) |
| 0x0c (cat 0x43, sub 0x0c) | Talkback Gain | `F7 43 0c 0c 00 01 [val_lo] [val_hi]` — range: -20dB to +40dB, 16-bit encoding |
| 0x0d (cat 0x43, sub 0x0c) | Talkback Phantom | `F7 43 0c 0d 00 01 [val_lo] [val_hi]` — val: 0x0101=on, 0x0001=off |
| 0x0e (cat 0x43, sub 0x0c) | Talkback Pad | `F7 43 0c 0e 00 01 [val_lo] [val_hi]` — val: 0x0101=on, 0x0001=off |
| 0x1f (cat 0x43, sub 0x15) | Talkback HPF On | `F7 43 15 1f [hpf_id] 00 00 00` — hpf_id: 0x01=on, 0x00=off |
| 0x20 (cat 0x43, sub 0x15) | Talkback HPF Freq | `F7 43 15 20 00 [freq_val] 00 00` — log scale 20Hz-20kHz, encoding similar to input HPF |
| 0x21 (cat 0x43, sub 0x15) | Talkback Trim | `F7 43 15 21 00 [trim_val] 00 00` — range: -24dB to +24dB, centered at 0x0080 |
| 0x11 (cat 0x43, sub 0x0b) | Talkback Momentary | `F7 43 0b 11 [mode] 00 00 00` — mode: 0x01=Momentary, 0x00=Latch |
| 0x0f (cat 0x43, sub 0x0b) | Talkback Routing | `F7 43 0b 0f [target_id] 00 [val_lo] [val_hi]` — val: 0x0100=on, 0x0000=off |
| Talkback Routing IDs | Group Targets | Grp1=0x48, Grp2=0x49, Grp3=0x4a, Grp4=0x4b |
| Talkback Routing IDs | Aux Targets | Aux1=0x58, Aux2=0x59, Aux3=0x5a...Aux8=0x5f |
| Talkback Routing IDs | Matrix Targets | Mtx1=0x73, Mtx2=0x74, Mtx3=0x75, Mtx4=0x76, Mtx5=0x77, Mtx6=0x78 |
| Talkback Routing IDs | Main Output | MainLR=0x68 |
| 0x0c (cat 0x10) | Insert Input Config | `F7 10 0c 0c [insert_id] [config] 00 [checksum]` — [insert_id]: 0x00-0x2f, [config]: socket type+channel encoding (TBD) |
| 0x0d (cat 0x0b, cat 0x10) | Insert Output Config | `F7 0b 10 0e [insert_id] [config] 00 1a` or `F7 10 10 0d [insert_id] [config] 00 1a` — socket type+channel (TBD) |
| (unknown) | Insert Operating Level | Digital/Analogue/-10dBV setting (register/encoding TBD) |
| 0x13 | Scene Recall (Go) | `F7 00 02 13 [scene_id] 30 00 00` — single frame; mixer confirms with `F7 02 02 1c [scene_id] 00 FF FF` and dumps full state |
| 0x1b | Scene Select cursor | `F7 00 02 1b [scene_id] 00 FF FF` — moves UI cursor to scene; mixer echoes `F7 02 02 1b ...`; NOT the same as recall |
| 0x1b + 0x0c | Scene Store | Frame 1: `F7 00 02 1b [scene_id] 00 FF FF`; Frame 2 (200ms later): `F7 00 02 0c [scene_id] 20 00 00` — two-frame protocol |
| 0x17 | Scene Delete | `F7 00 02 17 [scene_id] 20 00 00` — single frame; mixer confirms with `F7 02 02 1a [scene_id] 20 00 00` |
| 0x31 | Scene Crossfade | `F7 00 02 31 [scene_id] 40 [ms_lo] [ms_hi]` — per-scene crossfade time in milliseconds LE16 (0=off, max ~65535ms) |
| 0x18 (ChannelInfo) | Scene Rename | sub=0x08 ChannelInfo, payload: `00 02 18 [scene_id] 40 00 00 [name 16 bytes] 00` — max 16 ASCII chars |
