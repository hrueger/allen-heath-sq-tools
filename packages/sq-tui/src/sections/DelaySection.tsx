import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { NumberInput } from '../widgets/NumberInput';
import { SectionProps } from './types';
import { formatMs } from '../utils';

const ROW_ON = 0;
const ROW_DUR = 1;
export const DELAY_ROW_COUNT = 2;

export const DelaySection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_ON) {
        const next = !(channel.delayOn ?? false); channel.setDelayOn(next); addEvent(`delay → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  if (!isFocused) {
    const durStr = channel.delayDuration !== null ? formatMs(channel.delayDuration) : '--';
    const onStr = channel.delayOn ? ' [ON ] ' : ' [OFF] ';
    return <Text dimColor>{`─ DELAY ───${onStr}${durStr}`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="DELAY" enabled={channel.delayOn} isFocused={isFocRow(ROW_ON)} />
      <NumberInput
        value={channel.delayDuration} min={0} max={341} step={1}
        label="Dur" format={formatMs}
        isFocused={isFocRow(ROW_DUR)} isEditing={isEditing(ROW_DUR)}
        onChange={v => channel.setDelayDuration(v)} onEditEnd={onEditModeEnd}
      />
    </Box>
  );
};
