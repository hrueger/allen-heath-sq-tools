import type { SQMixer } from "@allen-heath-sq-tools/api";

export type OscArgValue = number | string;

export interface OscArg {
  name: string;
  type: "f" | "i" | "s";
  description: string;
  min?: number;
  max?: number;
  unit?: string;
  choices?: Array<number | string>;
}

export interface OscEntry {
  address: string;
  description: string;
  group: string;
  setArgs: OscArg[];
  getArgs: OscArg[];
  readable: boolean;
  writable: boolean;
  get?: (sq: SQMixer, indices: number[]) => OscArgValue[] | undefined;
  set?: (sq: SQMixer, indices: number[], args: OscArgValue[]) => void;
}

export type OscRegistry = Map<string, OscEntry>;
