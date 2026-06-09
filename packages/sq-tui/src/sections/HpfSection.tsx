import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { NumberInput } from '../widgets/NumberInput';
import { EnumSelect } from '../widgets/EnumSelect';
import { SectionProps } from './types';
import { formatHz, linearNorm } from '../utils';

const ROW_ON = 0;
const ROW_FREQ = 1;
const ROW_SLOPE = 2;
export const HPF_ROW_COUNT = 3;

const SLOPE_OPTIONS = [
  { value: 12, label: '12dB/oct' },
  { value: 18, label: '18dB/oct' },
  { value: 24, label: '24dB/oct' },
];

export const HpfSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  const slopeRef = React.useRef<number>(channel.hpfSlope ?? 12);

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_ON) {
        const next = !(channel.hpfOn ?? false); channel.setHpfOn(next); addEvent(`hpf → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  // Slope cycling
  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const slopes = SLOPE_OPTIONS.map(o => o.value);
    const idx = slopes.indexOf(slopeRef.current);
    if (key.rightArrow || key.downArrow) {
      slopeRef.current = slopes[(idx + 1) % slopes.length];
      channel.setHpfSlope(slopeRef.current);
    }
    if (key.leftArrow || key.upArrow) {
      slopeRef.current = slopes[(idx - 1 + slopes.length) % slopes.length];
      channel.setHpfSlope(slopeRef.current);
    }
  }, { isActive: isEditing(ROW_SLOPE) });

  if (!isFocused) {
    const freqStr = channel.hpfFreq !== null ? formatHz(channel.hpfFreq) : '--';
    const onStr = channel.hpfOn ? ' [ON ] ' : ' [OFF] ';
    return <Text dimColor>{`─ HPF ─────${onStr}${freqStr}`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="HPF" enabled={channel.hpfOn} isFocused={isFocRow(ROW_ON)} />
      <NumberInput
        value={channel.hpfFreq} min={20} max={2000} step={10}
        label="Freq" format={formatHz}
        normalize={v => linearNorm(Math.log10(v), Math.log10(20), Math.log10(2000))}
        isFocused={isFocRow(ROW_FREQ)} isEditing={isEditing(ROW_FREQ)}
        onChange={v => channel.setHpfFreq(v)} onEditEnd={onEditModeEnd}
      />
      <EnumSelect
        value={channel.hpfSlope} options={SLOPE_OPTIONS} label="Slope"
        isFocused={isFocRow(ROW_SLOPE)} isEditing={isEditing(ROW_SLOPE)}
      />
    </Box>
  );
};
