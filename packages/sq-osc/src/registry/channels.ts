import type { Channel, SQMixer } from "@allen-heath-sq-tools/api";
import type { OscEntry, OscArgValue } from "./types.ts";

type ChannelType = "input" | "stereo" | "fxreturn" | "bus" | "dca" | "main";

interface CapSet {
  gain: boolean;
  trim: boolean;
  pad: boolean;
  phantom: boolean;
  polarity: boolean;
  hpf: boolean;
  gate: boolean;
  comp: boolean;
  peq: boolean;
  delay: boolean;
  sends: boolean;
  fxSends: boolean;
  insert: boolean;
  directOut: boolean;
  pan: boolean;
  pafl: boolean;
  color: boolean;
}

const ALL_CAPS: CapSet = {
  gain: true, trim: true, pad: true, phantom: true, polarity: true,
  hpf: true, gate: true, comp: true, peq: true, delay: true,
  sends: true, fxSends: true, insert: true, directOut: true,
  pan: true, pafl: true, color: true,
};

const CAPS: Record<ChannelType, CapSet> = {
  input:    { ...ALL_CAPS },
  stereo:   { ...ALL_CAPS },
  fxreturn: { ...ALL_CAPS, gain: false, trim: false, pad: false, phantom: false, polarity: false, hpf: false, gate: false, delay: false, directOut: false },
  bus:      { ...ALL_CAPS, gain: false, trim: false, pad: false, phantom: false, polarity: false, gate: false, directOut: false, sends: false },
  dca:      { gain: false, trim: false, pad: false, phantom: false, polarity: false, hpf: false, gate: false, comp: false, peq: false, delay: false, sends: false, fxSends: false, insert: false, directOut: false, pan: false, pafl: true, color: false },
  main:     { ...ALL_CAPS, gain: false, trim: false, pad: false, phantom: false, polarity: false, gate: false, directOut: false, sends: false },
};

function getChannelCollection(sq: SQMixer, type: ChannelType, n: number): Channel {
  switch (type) {
    case "input":    return sq.inputs[n - 1];
    case "stereo":   return sq.stereoInputs[n - 1];
    case "fxreturn": return sq.fxReturns[n - 1];
    case "bus":      return sq.buses[n - 1];
    case "dca":      return sq.dcas[n - 1];
    case "main":     return sq.mainLR;
  }
}


export function buildChannelEntries(type: ChannelType, prefix: string, count: number): OscEntry[] {
  const cap = CAPS[type];
  const entries: OscEntry[] = [];

  function addr(type: ChannelType, param: string): string {
    return count === 0 ? `${prefix}/${param}` : `${prefix}/{n}/${param}`;
  }

  function g(param: string): string {
    return addr(type, param);
  }

  const getN = (indices: number[]): number => count === 0 ? 1 : indices[0];

  const boolGet = (prop: keyof Channel) => (sq: SQMixer, indices: number[]): OscArgValue[] | undefined => {
    const ch = getChannelCollection(sq, type, getN(indices));
    const v = ch[prop] as boolean | null;
    return v === null ? undefined : [v ? 1 : 0];
  };

  const numGet = (prop: keyof Channel) => (sq: SQMixer, indices: number[]): OscArgValue[] | undefined => {
    const ch = getChannelCollection(sq, type, getN(indices));
    const v = ch[prop] as number | null;
    return v === null ? undefined : [v];
  };

  const boolArg = (name: string) => [{ name, type: "i" as const, description: "0=off 1=on", min: 0, max: 1 }];
  const floatArg = (name: string, desc: string, min?: number, max?: number, unit?: string) =>
    [{ name, type: "f" as const, description: desc, min, max, unit }];

  // fader (dB)
  entries.push({
    address: g("fader"),
    description: "Fader level in dB (−90 = off, 0 = unity, +10 = max)",
    group: type,
    setArgs: floatArg("db", "fader level in dB", -90, 10, "dB"),
    getArgs: floatArg("db", "fader level in dB", -90, 10, "dB"),
    readable: true,
    writable: true,
    get: (sq, indices) => {
      const ch = getChannelCollection(sq, type, getN(indices));
      if (ch.level === null) return undefined;
      return [isFinite(ch.level) ? ch.level : -90];
    },
    set: (sq, indices, args) => {
      const db = args[0] as number;
      getChannelCollection(sq, type, getN(indices)).setLevel(db <= -90 ? -Infinity : db);
    },
  });

  // mute
  entries.push({
    address: g("mute"),
    description: "Mute state",
    group: type,
    setArgs: boolArg("muted"),
    getArgs: boolArg("muted"),
    readable: true,
    writable: true,
    get: boolGet("muted"),
    set: (sq, indices, args) => {
      getChannelCollection(sq, type, getN(indices)).setMute(args[0] !== 0);
    },
  });

  // pan
  if (cap.pan) {
    entries.push({
      address: g("pan"),
      description: "Pan position (-1.0 = full left, 0 = centre, +1.0 = full right)",
      group: type,
      setArgs: floatArg("pan", "pan position", -1, 1),
      getArgs: floatArg("pan", "pan position", -1, 1),
      readable: true,
      writable: true,
      get: numGet("pan"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setPan(args[0] as number);
      },
    });
  }

  // name
  entries.push({
    address: g("name"),
    description: "Channel name (max 6 characters)",
    group: type,
    setArgs: [{ name: "name", type: "s", description: "channel name (max 6 chars)" }],
    getArgs: [{ name: "name", type: "s", description: "channel name" }],
    readable: true,
    writable: true,
    get: (sq, indices) => {
      const ch = getChannelCollection(sq, type, getN(indices));
      return ch.name === null ? undefined : [ch.name];
    },
    set: (sq, indices, args) => {
      getChannelCollection(sq, type, getN(indices)).setName(String(args[0]).substring(0, 6));
    },
  });

  // gain
  if (cap.gain) {
    entries.push({
      address: g("gain"),
      description: "Preamp gain",
      group: type,
      setArgs: floatArg("db", "gain in dB", 0, 60, "dB"),
      getArgs: floatArg("db", "gain in dB", 0, 60, "dB"),
      readable: true,
      writable: true,
      get: numGet("gain"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGain(args[0] as number);
      },
    });
  }

  // trim
  if (cap.trim) {
    entries.push({
      address: g("trim"),
      description: "Input trim",
      group: type,
      setArgs: floatArg("db", "trim in dB", -24, 24, "dB"),
      getArgs: floatArg("db", "trim in dB", -24, 24, "dB"),
      readable: true,
      writable: true,
      get: numGet("trim"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setTrim(args[0] as number);
      },
    });
  }

  // phantom
  if (cap.phantom) {
    entries.push({
      address: g("phantom"),
      description: "48V phantom power",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("phantomOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setPhantomOn(args[0] !== 0);
      },
    });
  }

  // pad
  if (cap.pad) {
    entries.push({
      address: g("pad"),
      description: "-20 dB pad",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("padOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setPadOn(args[0] !== 0);
      },
    });
  }

  // polarity
  if (cap.polarity) {
    entries.push({
      address: g("polarity"),
      description: "Phase/polarity invert",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("polarityOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setPolarityOn(args[0] !== 0);
      },
    });
  }

  // HPF
  if (cap.hpf) {
    entries.push({
      address: g("hpf/on"),
      description: "High-pass filter on/off",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("hpfOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setHpfOn(args[0] !== 0);
      },
    });
    entries.push({
      address: g("hpf/freq"),
      description: "High-pass filter frequency",
      group: type,
      setArgs: floatArg("hz", "cutoff frequency in Hz", 20, 2000, "Hz"),
      getArgs: floatArg("hz", "cutoff frequency in Hz", 20, 2000, "Hz"),
      readable: true,
      writable: true,
      get: numGet("hpfFreq"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setHpfFreq(args[0] as number);
      },
    });
    entries.push({
      address: g("hpf/slope"),
      description: "High-pass filter slope",
      group: type,
      setArgs: [{ name: "slope", type: "i", description: "slope in dB/octave", choices: [12, 18, 24], unit: "dB/oct" }],
      getArgs: [{ name: "slope", type: "i", description: "slope in dB/octave", choices: [12, 18, 24], unit: "dB/oct" }],
      readable: true,
      writable: true,
      get: numGet("hpfSlope"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setHpfSlope(args[0] as number);
      },
    });
  }

  // Gate
  if (cap.gate) {
    const gateParams: Array<[string, string, number, number, string, keyof Channel, (ch: Channel, v: number) => void]> = [
      ["gate/on", "Gate on/off", 0, 1, "", "gateOn", (ch, v) => ch.setGateOn(v !== 0)],
    ];
    entries.push({
      address: g("gate/on"),
      description: "Gate on/off",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("gateOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGateOn(args[0] !== 0);
      },
    });
    entries.push({
      address: g("gate/threshold"),
      description: "Gate threshold",
      group: type,
      setArgs: floatArg("db", "threshold in dB", -128, 0, "dB"),
      getArgs: floatArg("db", "threshold in dB", -128, 0, "dB"),
      readable: true,
      writable: true,
      get: numGet("gateThreshold"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGateThreshold(args[0] as number);
      },
    });
    entries.push({
      address: g("gate/depth"),
      description: "Gate depth (attenuation below threshold)",
      group: type,
      setArgs: floatArg("db", "depth in dB", 0, 60, "dB"),
      getArgs: floatArg("db", "depth in dB", 0, 60, "dB"),
      readable: true,
      writable: true,
      get: numGet("gateDepth"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGateDepth(args[0] as number);
      },
    });
    entries.push({
      address: g("gate/attack"),
      description: "Gate attack time",
      group: type,
      setArgs: floatArg("ms", "attack time in ms", 0.05, 300, "ms"),
      getArgs: floatArg("ms", "attack time in ms", 0.05, 300, "ms"),
      readable: true,
      writable: true,
      get: numGet("gateAttack"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGateAttack(args[0] as number);
      },
    });
    entries.push({
      address: g("gate/release"),
      description: "Gate release time",
      group: type,
      setArgs: floatArg("ms", "release time in ms", 10, 1000, "ms"),
      getArgs: floatArg("ms", "release time in ms", 10, 1000, "ms"),
      readable: true,
      writable: true,
      get: numGet("gateRelease"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGateRelease(args[0] as number);
      },
    });
    entries.push({
      address: g("gate/hold"),
      description: "Gate hold time",
      group: type,
      setArgs: floatArg("ms", "hold time in ms", 10, 5000, "ms"),
      getArgs: floatArg("ms", "hold time in ms", 10, 5000, "ms"),
      readable: true,
      writable: true,
      get: numGet("gateHold"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setGateHold(args[0] as number);
      },
    });
    // suppress unused variable warning
    void gateParams;
  }

  // Compressor
  if (cap.comp) {
    entries.push({
      address: g("comp/on"),
      description: "Compressor on/off",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("compOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setCompOn(args[0] !== 0);
      },
    });
    entries.push({
      address: g("comp/threshold"),
      description: "Compressor threshold",
      group: type,
      setArgs: floatArg("db", "threshold in dB", -46, 18, "dB"),
      getArgs: floatArg("db", "threshold in dB", -46, 18, "dB"),
      readable: true,
      writable: true,
      get: numGet("compThreshold"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setCompThreshold(args[0] as number);
      },
    });
    entries.push({
      address: g("comp/ratio"),
      description: "Compressor ratio (use 0 for ∞:1)",
      group: type,
      setArgs: floatArg("ratio", "compression ratio (e.g. 4.0 = 4:1)", 1),
      getArgs: floatArg("ratio", "compression ratio"),
      readable: true,
      writable: true,
      get: numGet("compRatio"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setCompRatio(args[0] as number);
      },
    });
    entries.push({
      address: g("comp/gain"),
      description: "Compressor makeup gain",
      group: type,
      setArgs: floatArg("db", "makeup gain in dB", 0, 18, "dB"),
      getArgs: floatArg("db", "makeup gain in dB", 0, 18, "dB"),
      readable: true,
      writable: true,
      get: numGet("compGain"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setCompGain(args[0] as number);
      },
    });
  }

  // Delay
  if (cap.delay) {
    entries.push({
      address: g("delay/on"),
      description: "Channel delay on/off",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("delayOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setDelayOn(args[0] !== 0);
      },
    });
    entries.push({
      address: g("delay/time"),
      description: "Channel delay time",
      group: type,
      setArgs: floatArg("ms", "delay time in milliseconds", 0, 341, "ms"),
      getArgs: floatArg("ms", "delay time in milliseconds", 0, 341, "ms"),
      readable: true,
      writable: true,
      get: numGet("delayDuration"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setDelayDuration(args[0] as number);
      },
    });
  }

  // PEQ
  if (cap.peq) {
    entries.push({
      address: g("peq/on"),
      description: "Parametric EQ on/off",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("peqOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setPeqOn(args[0] !== 0);
      },
    });

    const peqBands: Array<[string, string, (ch: Channel) => number | null, (ch: Channel, v: number) => void, "gain" | "freq" | "q" | "shape"]>[] = [
      [
        ["peq/lf/gain", "PEQ low-freq band gain",       (ch) => ch.peqLfGain,  (ch, v) => ch.setPeqLfGain(v),  "gain"],
        ["peq/lf/freq", "PEQ low-freq band frequency",  (ch) => ch.peqLfFreq,  (ch, v) => ch.setPeqLfFreq(v),  "freq"],
        ["peq/lf/q",    "PEQ low-freq band Q factor",   (ch) => ch.peqLfQ,     (ch, v) => ch.setPeqLfQ(v),     "q"],
        ["peq/lf/shape","PEQ low-freq band shape",      (ch) => ch.peqLfShape, (ch, v) => ch.setPeqLfShape(v), "shape"],
      ],
      [
        ["peq/lm/gain", "PEQ low-mid band gain",        (ch) => ch.peqLmGain,  (ch, v) => ch.setPeqLmGain(v),  "gain"],
        ["peq/lm/freq", "PEQ low-mid band frequency",   (ch) => ch.peqLmFreq,  (ch, v) => ch.setPeqLmFreq(v),  "freq"],
        ["peq/lm/q",    "PEQ low-mid band Q factor",    (ch) => ch.peqLmQ,     (ch, v) => ch.setPeqLmQ(v),     "q"],
      ],
      [
        ["peq/hm/gain", "PEQ high-mid band gain",       (ch) => ch.peqHmGain,  (ch, v) => ch.setPeqHmGain(v),  "gain"],
        ["peq/hm/freq", "PEQ high-mid band frequency",  (ch) => ch.peqHmFreq,  (ch, v) => ch.setPeqHmFreq(v),  "freq"],
        ["peq/hm/q",    "PEQ high-mid band Q factor",   (ch) => ch.peqHmQ,     (ch, v) => ch.setPeqHmQ(v),     "q"],
      ],
      [
        ["peq/hf/gain", "PEQ high-freq band gain",      (ch) => ch.peqHfGain,  (ch, v) => ch.setPeqHfGain(v),  "gain"],
        ["peq/hf/freq", "PEQ high-freq band frequency", (ch) => ch.peqHfFreq,  (ch, v) => ch.setPeqHfFreq(v),  "freq"],
        ["peq/hf/q",    "PEQ high-freq band Q factor",  (ch) => ch.peqHfQ,     (ch, v) => ch.setPeqHfQ(v),     "q"],
        ["peq/hf/shape","PEQ high-freq band shape",     (ch) => ch.peqHfShape, (ch, v) => ch.setPeqHfShape(v), "shape"],
      ],
    ];

    for (const band of peqBands) {
      for (const [param, desc, getter, setter, kind] of band) {
        if (kind === "shape") {
          entries.push({
            address: g(param),
            description: `${desc} (0=Peak, 6=Low Shelf, 11=High Pass)`,
            group: type,
            setArgs: [{ name: "shape", type: "i", description: "0=Peak 6=LowShelf 11=HighPass", choices: [0, 6, 11] }],
            getArgs: [{ name: "shape", type: "i", description: "0=Peak 6=LowShelf 11=HighPass", choices: [0, 6, 11] }],
            readable: true,
            writable: true,
            get: (sq, indices) => {
              const v = getter(getChannelCollection(sq, type, getN(indices)));
              return v === null ? undefined : [v];
            },
            set: (sq, indices, args) => setter(getChannelCollection(sq, type, getN(indices)), args[0] as number),
          });
        } else if (kind === "gain") {
          entries.push({
            address: g(param),
            description: desc,
            group: type,
            setArgs: floatArg("db", "gain in dB", -15, 15, "dB"),
            getArgs: floatArg("db", "gain in dB", -15, 15, "dB"),
            readable: true,
            writable: true,
            get: (sq, indices) => {
              const v = getter(getChannelCollection(sq, type, getN(indices)));
              return v === null ? undefined : [v];
            },
            set: (sq, indices, args) => setter(getChannelCollection(sq, type, getN(indices)), args[0] as number),
          });
        } else if (kind === "freq") {
          entries.push({
            address: g(param),
            description: desc,
            group: type,
            setArgs: floatArg("hz", "frequency in Hz", 20, 20000, "Hz"),
            getArgs: floatArg("hz", "frequency in Hz", 20, 20000, "Hz"),
            readable: true,
            writable: true,
            get: (sq, indices) => {
              const v = getter(getChannelCollection(sq, type, getN(indices)));
              return v === null ? undefined : [v];
            },
            set: (sq, indices, args) => setter(getChannelCollection(sq, type, getN(indices)), args[0] as number),
          });
        } else {
          entries.push({
            address: g(param),
            description: desc,
            group: type,
            setArgs: floatArg("q", "Q factor"),
            getArgs: floatArg("q", "Q factor"),
            readable: true,
            writable: true,
            get: (sq, indices) => {
              const v = getter(getChannelCollection(sq, type, getN(indices)));
              return v === null ? undefined : [v];
            },
            set: (sq, indices, args) => setter(getChannelCollection(sq, type, getN(indices)), args[0] as number),
          });
        }
      }
    }
  }

  // Bus sends
  if (cap.sends) {
    for (let b = 1; b <= 12; b++) {
      const busNum = b;
      const sendAddr = count === 0
        ? `${prefix}/send/${busNum}`
        : `${prefix}/{n}/send/${busNum}`;
      entries.push({
        address: sendAddr,
        description: `Send level to mix bus ${busNum} in dB`,
        group: type,
        setArgs: floatArg("db", "send level in dB (−90 = off, 0 = unity, +10 = max)", -90, 10, "dB"),
        getArgs: floatArg("db", "send level in dB", -90, 10, "dB"),
        readable: true,
        writable: true,
        get: (sq, indices) => {
          const ch = getChannelCollection(sq, type, getN(indices));
          const v = ch.sends.get(busNum);
          if (v === undefined) return undefined;
          return [isFinite(v) ? v : -90];
        },
        set: (sq, indices, args) => {
          const db = args[0] as number;
          getChannelCollection(sq, type, getN(indices)).setSend(busNum, db <= -90 ? -Infinity : db);
        },
      });
    }
  }

  // FX sends
  if (cap.fxSends) {
    for (let x = 1; x <= 4; x++) {
      const fxNum = x;
      const sendAddr = count === 0
        ? `${prefix}/sendfx/${fxNum}`
        : `${prefix}/{n}/sendfx/${fxNum}`;
      entries.push({
        address: sendAddr,
        description: `Send level to FX return ${fxNum} in dB`,
        group: type,
        setArgs: floatArg("db", "send level in dB (−90 = off, 0 = unity, +10 = max)", -90, 10, "dB"),
        getArgs: floatArg("db", "send level in dB", -90, 10, "dB"),
        readable: true,
        writable: true,
        get: (sq, indices) => {
          const ch = getChannelCollection(sq, type, getN(indices));
          const v = ch.fxSends.get(fxNum);
          if (v === undefined) return undefined;
          return [isFinite(v) ? v : -90];
        },
        set: (sq, indices, args) => {
          const db = args[0] as number;
          getChannelCollection(sq, type, getN(indices)).setSendFx(fxNum, db <= -90 ? -Infinity : db);
        },
      });
    }
  }

  // Insert
  if (cap.insert) {
    entries.push({
      address: g("insert"),
      description: "Insert enabled",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("insertEnabled"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setInsertEnabled(args[0] !== 0);
      },
    });
  }

  // Direct out
  if (cap.directOut) {
    entries.push({
      address: g("directout"),
      description: "Direct output assignment (0 = none, 1–3 = output number)",
      group: type,
      setArgs: [{ name: "out", type: "i", description: "0=none, 1–3=output number", min: 0, max: 3 }],
      getArgs: [{ name: "out", type: "i", description: "0=none, 1–3=output number", min: 0, max: 3 }],
      readable: true,
      writable: true,
      get: (sq, indices) => {
        const ch = getChannelCollection(sq, type, getN(indices));
        return ch.directOut === null ? undefined : [ch.directOut ?? 0];
      },
      set: (sq, indices, args) => {
        const v = args[0] as number;
        getChannelCollection(sq, type, getN(indices)).setDirectOut(v === 0 ? null : v);
      },
    });
  }

  // PAFL (solo)
  if (cap.pafl) {
    entries.push({
      address: g("pafl"),
      description: "PAFL (solo) on/off",
      group: type,
      setArgs: boolArg("on"),
      getArgs: boolArg("on"),
      readable: true,
      writable: true,
      get: boolGet("paflOn"),
      set: (sq, indices, args) => {
        getChannelCollection(sq, type, getN(indices)).setPaflOn(args[0] !== 0);
      },
    });
  }

  // Color (write-only)
  if (cap.color) {
    entries.push({
      address: g("color"),
      description: "Channel colour (send 0 0 0 for transparent)",
      group: type,
      setArgs: [
        { name: "r", type: "i", description: "red 0–255", min: 0, max: 255 },
        { name: "g", type: "i", description: "green 0–255", min: 0, max: 255 },
        { name: "b", type: "i", description: "blue 0–255", min: 0, max: 255 },
      ],
      getArgs: [],
      readable: false,
      writable: true,
      set: (sq, indices, args) => {
        const ch = getChannelCollection(sq, type, getN(indices));
        const r = args[0] as number, g2 = args[1] as number, b2 = args[2] as number;
        if (r === 0 && g2 === 0 && b2 === 0) {
          ch.setColorTransparent();
        } else {
          ch.setColor(r, g2, b2);
        }
      },
    });
  }

  return entries;
}
