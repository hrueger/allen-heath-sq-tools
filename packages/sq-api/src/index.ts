export { SQMixer } from "./api/mixer";
export type { SQMixerOptions, SQModel } from "./api/mixer";
export {
  Channel,
  InputChannel,
  StereoInput,
  FxReturn,
  MixBus,
  DcaGroup,
  MainLR,
} from "./api/channel";
export { dbToFader, faderToDb } from "./api/parameter";
export { DirectOutTapPoint, ChannelColor } from "./api/conversions";

// Transport layer (for direct protocol access)
export { Connection, SQ_TCP_PORT } from "./transport/connection";
export type { ConnectOptions, VersionInfo, DspFrame } from "./transport/connection";
export { Framer, encodeFrame, encodeKeepalive, Sub, DSP_MARKER } from "./transport/frame";
export type { Frame } from "./transport/frame";
export { Buf } from "./transport/buffer";
export { discover } from "./transport/discovery";
export type { DiscoveredMixer, MixerFamily } from "./transport/discovery";
