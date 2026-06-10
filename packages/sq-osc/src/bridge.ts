import type { Channel, SQMixer } from "@allen-heath-sq-tools/api";
import type { OscClient } from "./osc.ts";
import type { BridgeConfig } from "./config.ts";

function wireChannelFeedback(
  ch: Channel,
  prefix: string,
  client: OscClient,
  config: BridgeConfig,
): void {
  const bcast = (addr: string, args: Array<number | string>) => {
    if (config.debug) {
      const argStr = args.map(a => JSON.stringify(a)).join(" ");
      const dest = config.oscTargetHost ?? "255.255.255.255";
      console.log(`[osc out] ${addr}${argStr ? " " + argStr : ""} → ${dest}:${config.oscOutPort}`);
    }
    if (config.oscTargetHost) {
      client.send(config.oscTargetHost, config.oscOutPort, addr, args);
    } else {
      client.broadcast(config.oscOutPort, addr, args);
    }
  };

  ch.on("level", (v: number) => bcast(`${prefix}/fader`, [v]));
  ch.on("mute",  (v: boolean) => bcast(`${prefix}/mute`, [v ? 1 : 0]));
  ch.on("pan",   (v: number) => bcast(`${prefix}/pan`, [v]));
  ch.on("gain",  (v: number) => bcast(`${prefix}/gain`, [v]));
  ch.on("trim",  (v: number) => bcast(`${prefix}/trim`, [v]));
  ch.on("name",  (v: string) => bcast(`${prefix}/name`, [v]));

  ch.on("phantom-on",  (v: boolean) => bcast(`${prefix}/phantom`, [v ? 1 : 0]));
  ch.on("pad-on",      (v: boolean) => bcast(`${prefix}/pad`, [v ? 1 : 0]));
  ch.on("polarity-on", (v: boolean) => bcast(`${prefix}/polarity`, [v ? 1 : 0]));

  ch.on("hpf-on",    (v: boolean) => bcast(`${prefix}/hpf/on`, [v ? 1 : 0]));
  ch.on("hpf-freq",  (v: number)  => bcast(`${prefix}/hpf/freq`, [v]));
  ch.on("hpf-slope", (v: number)  => bcast(`${prefix}/hpf/slope`, [v]));

  ch.on("gate-on",        (v: boolean) => bcast(`${prefix}/gate/on`, [v ? 1 : 0]));
  ch.on("gate-threshold", (v: number)  => bcast(`${prefix}/gate/threshold`, [v]));
  ch.on("gate-depth",     (v: number)  => bcast(`${prefix}/gate/depth`, [v]));
  ch.on("gate-attack",    (v: number)  => bcast(`${prefix}/gate/attack`, [v]));
  ch.on("gate-release",   (v: number)  => bcast(`${prefix}/gate/release`, [v]));
  ch.on("gate-hold",      (v: number)  => bcast(`${prefix}/gate/hold`, [v]));

  ch.on("comp-on",        (v: boolean) => bcast(`${prefix}/comp/on`, [v ? 1 : 0]));
  ch.on("comp-threshold", (v: number)  => bcast(`${prefix}/comp/threshold`, [v]));
  ch.on("comp-ratio",     (v: number)  => bcast(`${prefix}/comp/ratio`, [v]));
  ch.on("comp-gain",      (v: number)  => bcast(`${prefix}/comp/gain`, [v]));

  ch.on("delay-on",       (v: boolean) => bcast(`${prefix}/delay/on`, [v ? 1 : 0]));
  ch.on("delay-duration", (v: number)  => bcast(`${prefix}/delay/time`, [v]));

  ch.on("peq-on",       (v: boolean) => bcast(`${prefix}/peq/on`, [v ? 1 : 0]));
  ch.on("peq-lf-gain",  (v: number)  => bcast(`${prefix}/peq/lf/gain`, [v]));
  ch.on("peq-lf-freq",  (v: number)  => bcast(`${prefix}/peq/lf/freq`, [v]));
  ch.on("peq-lf-q",     (v: number)  => bcast(`${prefix}/peq/lf/q`, [v]));
  ch.on("peq-lf-shape", (v: number)  => bcast(`${prefix}/peq/lf/shape`, [v]));
  ch.on("peq-lm-gain",  (v: number)  => bcast(`${prefix}/peq/lm/gain`, [v]));
  ch.on("peq-lm-freq",  (v: number)  => bcast(`${prefix}/peq/lm/freq`, [v]));
  ch.on("peq-lm-q",     (v: number)  => bcast(`${prefix}/peq/lm/q`, [v]));
  ch.on("peq-hm-gain",  (v: number)  => bcast(`${prefix}/peq/hm/gain`, [v]));
  ch.on("peq-hm-freq",  (v: number)  => bcast(`${prefix}/peq/hm/freq`, [v]));
  ch.on("peq-hm-q",     (v: number)  => bcast(`${prefix}/peq/hm/q`, [v]));
  ch.on("peq-hf-gain",  (v: number)  => bcast(`${prefix}/peq/hf/gain`, [v]));
  ch.on("peq-hf-freq",  (v: number)  => bcast(`${prefix}/peq/hf/freq`, [v]));
  ch.on("peq-hf-q",     (v: number)  => bcast(`${prefix}/peq/hf/q`, [v]));
  ch.on("peq-hf-shape", (v: number)  => bcast(`${prefix}/peq/hf/shape`, [v]));

  ch.on("insert-enabled", (v: boolean) => bcast(`${prefix}/insert`, [v ? 1 : 0]));
  ch.on("pafl-on",        (v: boolean) => bcast(`${prefix}/pafl`, [v ? 1 : 0]));
  ch.on("direct-out",     (v: number | null) => bcast(`${prefix}/directout`, [v ?? 0]));

  ch.on("send",    (busNum: number, v: number) => bcast(`${prefix}/send/${busNum}`, [v]));
  ch.on("send-fx", (fxNum: number, v: number)  => bcast(`${prefix}/sendfx/${fxNum}`, [v]));
}

export function wireBridge(sq: SQMixer, client: OscClient, config: BridgeConfig): void {
  sq.inputs.forEach((ch, i) =>
    wireChannelFeedback(ch, `/input/${i + 1}`, client, config));
  sq.stereoInputs.forEach((ch, i) =>
    wireChannelFeedback(ch, `/stereo/${i + 1}`, client, config));
  sq.fxReturns.forEach((ch, i) =>
    wireChannelFeedback(ch, `/fxreturn/${i + 1}`, client, config));
  sq.buses.forEach((ch, i) =>
    wireChannelFeedback(ch, `/bus/${i + 1}`, client, config));
  sq.dcas.forEach((ch, i) =>
    wireChannelFeedback(ch, `/dca/${i + 1}`, client, config));
  wireChannelFeedback(sq.mainLR, "/main", client, config);

  const bcast = (addr: string, args: Array<number | string>) => {
    if (config.debug) {
      const argStr = args.map(a => JSON.stringify(a)).join(" ");
      const dest = config.oscTargetHost ?? "255.255.255.255";
      console.log(`[osc out] ${addr}${argStr ? " " + argStr : ""} → ${dest}:${config.oscOutPort}`);
    }
    if (config.oscTargetHost) {
      client.send(config.oscTargetHost, config.oscOutPort, addr, args);
    } else {
      client.broadcast(config.oscOutPort, addr, args);
    }
  };

  sq.on("mute-group", (n: number, on: boolean) =>
    bcast(`/mute-group/${n}`, [on ? 1 : 0]));
  sq.on("talkback-on", (on: boolean) =>
    bcast("/talkback/on", [on ? 1 : 0]));
  sq.on("talkback-gain", (db: number) =>
    bcast("/talkback/gain", [db]));
  sq.on("scene-recall", (n: number) =>
    bcast(`/scene/${n}/recall`, []));
  sq.on("scene-name", (n: number, name: string | null) => {
    if (name !== null) bcast(`/scene/${n}/name`, [name]);
  });
}
