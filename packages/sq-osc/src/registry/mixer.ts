import type { SQMixer } from "@allen-heath-sq-tools/api";
import type { OscEntry } from "./types.ts";

export function buildMixerEntries(): OscEntry[] {
  const entries: OscEntry[] = [];

  const boolArg = (name: string) => [{ name, type: "i" as const, description: "0=off 1=on", min: 0, max: 1 }];
  const intArg = (name: string, desc: string, min?: number, max?: number) =>
    [{ name, type: "i" as const, description: desc, min, max }];
  const floatArg = (name: string, desc: string, min?: number, max?: number, unit?: string) =>
    [{ name, type: "f" as const, description: desc, min, max, unit }];

  // Mute groups 1-8
  entries.push({
    address: "/mute-group/{n}",
    description: "Mute group on/off (n=1–8)",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: boolArg("on"),
    readable: true,
    writable: true,
    get: (sq, indices) => {
      const v = sq.muteGroups[indices[0] - 1];
      return v === null ? undefined : [v ? 1 : 0];
    },
    set: (sq, indices, args) => {
      sq.setMuteGroupOn(indices[0], args[0] !== 0);
    },
  });

  // Scenes — all addressed as /scene/{n}/… (n=1–300)
  entries.push({
    address: "/scene/{n}/recall",
    description: "Recall scene n (n=1–300)",
    group: "global",
    setArgs: [],
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices) => sq.recallScene(indices[0]),
  });

  entries.push({
    address: "/scene/{n}/store",
    description: "Store current state to scene n (n=1–300)",
    group: "global",
    setArgs: [],
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices) => sq.storeScene(indices[0]),
  });

  entries.push({
    address: "/scene/{n}/delete",
    description: "Delete scene n (n=1–300)",
    group: "global",
    setArgs: [],
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices) => sq.deleteScene(indices[0]),
  });

  entries.push({
    address: "/scene/{n}/rename",
    description: "Rename scene n (n=1–300)",
    group: "global",
    setArgs: [{ name: "name", type: "s" as const, description: "new scene name (max 16 chars)" }],
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices, args) => sq.renameScene(indices[0], String(args[0])),
  });

  entries.push({
    address: "/scene/{n}/name",
    description: "Scene name, read-only (n=1–300)",
    group: "global",
    setArgs: [],
    getArgs: [{ name: "name", type: "s" as const, description: "scene name" }],
    readable: true,
    writable: false,
    get: (sq, indices) => {
      const v = sq.sceneNames[indices[0] - 1];
      return v === null ? undefined : [v];
    },
  });

  entries.push({
    address: "/scene/{n}/crossfade",
    description: "Per-scene crossfade time in ms (n=1–300)",
    group: "global",
    setArgs: floatArg("ms", "crossfade time in ms", 0, 65535, "ms"),
    getArgs: floatArg("ms", "crossfade time in ms", 0, 65535, "ms"),
    readable: true,
    writable: true,
    get: (sq, indices) => {
      const v = sq.sceneCrossfadeMs[indices[0] - 1];
      return v === null ? undefined : [v];
    },
    set: (sq, indices, args) => sq.setSceneCrossfadeMs(indices[0], args[0] as number),
  });

  // Talkback
  entries.push({
    address: "/talkback/on",
    description: "Talkback on/off",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: boolArg("on"),
    readable: true,
    writable: true,
    get: (sq) => sq.talkbackOn === null ? undefined : [sq.talkbackOn ? 1 : 0],
    set: (sq, _indices, args) => sq.setTalkbackOn(args[0] !== 0),
  });

  entries.push({
    address: "/talkback/gain",
    description: "Talkback microphone gain",
    group: "global",
    setArgs: floatArg("db", "gain in dB", -20, 40, "dB"),
    getArgs: floatArg("db", "gain in dB", -20, 40, "dB"),
    readable: true,
    writable: true,
    get: (sq) => sq.talkbackGainDb === null ? undefined : [sq.talkbackGainDb],
    set: (sq, _indices, args) => sq.setTalkbackGain(args[0] as number),
  });

  entries.push({
    address: "/talkback/phantom",
    description: "Talkback mic 48V phantom power",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackPhantomOn(args[0] !== 0),
  });

  entries.push({
    address: "/talkback/pad",
    description: "Talkback mic -20 dB pad",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackPadOn(args[0] !== 0),
  });

  entries.push({
    address: "/talkback/hpf/on",
    description: "Talkback high-pass filter on/off",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackHpfOn(args[0] !== 0),
  });

  entries.push({
    address: "/talkback/hpf/freq",
    description: "Talkback high-pass filter frequency",
    group: "global",
    setArgs: floatArg("hz", "cutoff frequency in Hz", 20, 2000, "Hz"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackHpfFreq(args[0] as number),
  });

  entries.push({
    address: "/talkback/trim",
    description: "Talkback mic trim",
    group: "global",
    setArgs: floatArg("db", "trim in dB", -24, 24, "dB"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackTrim(args[0] as number),
  });

  entries.push({
    address: "/talkback/momentary",
    description: "Talkback momentary mode (1=hold-to-talk, 0=latch)",
    group: "global",
    setArgs: boolArg("momentary"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackMomentary(args[0] !== 0),
  });

  entries.push({
    address: "/talkback/to/mainlr",
    description: "Talkback routed to Main L/R",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setTalkbackToMainLR(args[0] !== 0),
  });

  entries.push({
    address: "/talkback/to/group/{n}",
    description: "Talkback routed to group n (n=1–4)",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices, args) => sq.setTalkbackToGroup(indices[0], args[0] !== 0),
  });

  entries.push({
    address: "/talkback/to/aux/{n}",
    description: "Talkback routed to aux n (n=1–8)",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices, args) => sq.setTalkbackToAux(indices[0], args[0] !== 0),
  });

  entries.push({
    address: "/talkback/to/matrix/{n}",
    description: "Talkback routed to matrix n (n=1–6)",
    group: "global",
    setArgs: boolArg("on"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, indices, args) => sq.setTalkbackToMatrix(indices[0], args[0] !== 0),
  });

  // Direct out global settings
  entries.push({
    address: "/directout/tappoint",
    description: "Direct output tap point (0=PostPreamp 1=PostHPF 2=PostGate 3=PostInsert 4=PostPEQ 5=PostComp 6=PostDelay)",
    group: "global",
    setArgs: [{ name: "tap", type: "i" as const, description: "tap point 0–6", min: 0, max: 6, choices: [0,1,2,3,4,5,6] }],
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => sq.setDirectOutTapPoint(args[0] as number),
  });

  const doFollowMethods: Array<[string, string, (sq: SQMixer, on: boolean) => void]> = [
    ["fader",     "Direct out follows fader level",     (sq, on) => sq.setDirectOutFollowFader(on)],
    ["mute",      "Direct out follows mute state",      (sq, on) => sq.setDirectOutFollowMute(on)],
    ["dcafader",  "Direct out follows DCA fader",       (sq, on) => sq.setDirectOutFollowDCAFader(on)],
    ["dcamute",   "Direct out follows DCA mute",        (sq, on) => sq.setDirectOutFollowDCAMute(on)],
    ["mutegroup", "Direct out follows mute groups",     (sq, on) => sq.setDirectOutFollowMuteGroup(on)],
  ];

  for (const [key, desc, method] of doFollowMethods) {
    entries.push({
      address: `/directout/follow/${key}`,
      description: desc,
      group: "global",
      setArgs: boolArg("on"),
      getArgs: [],
      readable: false,
      writable: true,
      set: (sq, _indices, args) => method(sq, args[0] !== 0),
    });
  }

  entries.push({
    address: "/directout/level",
    description: "Direct output level trim (send -999 for -∞/mute)",
    group: "global",
    setArgs: floatArg("db", "level in dB, or -999 for off"),
    getArgs: [],
    readable: false,
    writable: true,
    set: (sq, _indices, args) => {
      const v = args[0] as number;
      sq.setDirectOutLevel(v <= -999 ? null : v);
    },
  });

  // Bridge status (meta)
  entries.push({
    address: "/bridge/status",
    description: "Query bridge connection status — replies with 'connected' or 'disconnected'",
    group: "global",
    setArgs: [],
    getArgs: [{ name: "status", type: "s" as const, description: "connection status" }],
    readable: true,
    writable: false,
    get: (sq) => [sq.connected ? "connected" : "disconnected"],
  });

  return entries;
}
