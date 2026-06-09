import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { NumberInput } from '../widgets/NumberInput';
import { EnumSelect } from '../widgets/EnumSelect';
import { SectionProps } from './types';
import { formatDbUnit, linearNorm } from '../utils';

const ROW_ON = 0;
const ROW_THR = 1;
const ROW_RATIO = 2;
const ROW_GAIN = 3;
export const COMP_ROW_COUNT = 4;

const RATIO_VALUES = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 32, 64, 128, 256, Infinity];
const RATIO_OPTIONS = RATIO_VALUES.map(v => ({
  value: v,
  label: !isFinite(v) ? '∞:1' : Number.isInteger(v) ? `${v}:1` : `${v}:1`,
}));

export const CompSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  const ratioRef = React.useRef<number>(channel.compRatio ?? 1);

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_ON) {
        const next = !(channel.compOn ?? false); channel.setCompOn(next); addEvent(`comp → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  // Ratio cycling
  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const idx = RATIO_VALUES.indexOf(ratioRef.current);
    const safeIdx = idx === -1 ? 0 : idx;
    if (key.rightArrow || key.downArrow) {
      ratioRef.current = RATIO_VALUES[Math.min(safeIdx + 1, RATIO_VALUES.length - 1)];
      channel.setCompRatio(ratioRef.current);
    }
    if (key.leftArrow || key.upArrow) {
      ratioRef.current = RATIO_VALUES[Math.max(safeIdx - 1, 0)];
      channel.setCompRatio(ratioRef.current);
    }
  }, { isActive: isEditing(ROW_RATIO) });

  if (!isFocused) {
    const thrStr = channel.compThreshold !== null ? `${channel.compThreshold.toFixed(1)}dB` : '--';
    const ratioStr = channel.compRatio !== null
      ? (!isFinite(channel.compRatio) ? '∞:1' : `${channel.compRatio}:1`)
      : '--';
    const onStr = channel.compOn ? ' [ON ] ' : ' [OFF] ';
    return <Text dimColor>{`─ COMP ────${onStr}${thrStr}  ${ratioStr}`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="COMP" enabled={channel.compOn} isFocused={isFocRow(ROW_ON)} />
      <NumberInput
        value={channel.compThreshold} min={-46} max={18} step={1}
        label="Thresh" format={v => formatDbUnit(v)}
        normalize={v => linearNorm(v, -46, 18)}
        isFocused={isFocRow(ROW_THR)} isEditing={isEditing(ROW_THR)}
        onChange={v => channel.setCompThreshold(v)} onEditEnd={onEditModeEnd}
      />
      <EnumSelect
        value={channel.compRatio} options={RATIO_OPTIONS} label="Ratio"
        isFocused={isFocRow(ROW_RATIO)} isEditing={isEditing(ROW_RATIO)}
      />
      <NumberInput
        value={channel.compGain} min={0} max={18} step={0.5}
        label="Gain" format={v => formatDbUnit(v)}
        isFocused={isFocRow(ROW_GAIN)} isEditing={isEditing(ROW_GAIN)}
        onChange={v => channel.setCompGain(v)} onEditEnd={onEditModeEnd}
      />
    </Box>
  );
};
