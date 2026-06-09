import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { NumberInput } from '../widgets/NumberInput';
import { Toggle } from '../widgets/Toggle';
import { SectionProps } from './types';
import { formatDbUnit, clamp } from '../utils';

const ROW_GAIN = 0;
const ROW_TRIM = 1;
const ROW_PAD = 2;
const ROW_PHANTOM = 3;
const ROW_POLARITY = 4;
export const PREAMP_ROW_COUNT = 5;

const TOGGLE_ROWS = new Set([ROW_PAD, ROW_PHANTOM, ROW_POLARITY]);

export const PreampSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_PAD) {
        const next = !(channel.padOn ?? false); channel.setPadOn(next); addEvent(`pad → ${next ? 'ON' : 'OFF'}`);
      } else if (selectedRow === ROW_PHANTOM) {
        const next = !(channel.phantomOn ?? false); channel.setPhantomOn(next); addEvent(`48V → ${next ? 'ON' : 'OFF'}`);
      } else if (selectedRow === ROW_POLARITY) {
        const next = !(channel.polarityOn ?? false); channel.setPolarityOn(next); addEvent(`polarity → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  if (!isFocused) {
    const gainStr = channel.gain !== null ? `${channel.gain.toFixed(0)}dB` : '--';
    const extras = `${channel.phantomOn ? ' [48V]' : ''}${channel.padOn ? ' [PAD]' : ''}`;
    return <Text dimColor>{`─ PREAMP── Gain:${gainStr.padStart(5)}${extras}`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="PREAMP" />
      <NumberInput
        value={channel.gain} min={0} max={60} step={1}
        label="Gain" format={v => formatDbUnit(v)}
        isFocused={isFocRow(ROW_GAIN)} isEditing={isEditing(ROW_GAIN)}
        onChange={v => channel.setGain(v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={channel.trim} min={-24} max={24} step={0.5}
        label="Trim" format={v => formatDbUnit(v)}
        isFocused={isFocRow(ROW_TRIM)} isEditing={isEditing(ROW_TRIM)}
        onChange={v => channel.setTrim(v)} onEditEnd={onEditModeEnd}
      />
      <Toggle value={channel.padOn} label="  Pad     " onLabel="-20dB" isFocused={isFocRow(ROW_PAD)} />
      <Toggle value={channel.phantomOn} label="  Phantom " onLabel=" 48V" isFocused={isFocRow(ROW_PHANTOM)} />
      <Toggle value={channel.polarityOn} label="  Polarity" onLabel="FLIP" isFocused={isFocRow(ROW_POLARITY)} />
    </Box>
  );
};
