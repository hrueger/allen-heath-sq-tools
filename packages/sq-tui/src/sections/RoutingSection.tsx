import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { Toggle } from '../widgets/Toggle';
import { EnumSelect } from '../widgets/EnumSelect';
import { SectionProps } from './types';

const ROW_INSERT = 0;
const ROW_DIRECT = 1;
export const ROUTING_ROW_COUNT = 2;

const DIRECT_OPTIONS = [
  { value: null as number | null, label: 'Off   ' },
  { value: 1, label: 'Out 1 ' },
  { value: 2, label: 'Out 2 ' },
  { value: 3, label: 'Out 3 ' },
];

export const RoutingSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  const directRef = React.useRef<number | null>(channel.directOut);

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_INSERT) {
        const next = !(channel.insertEnabled ?? false); channel.setInsertEnabled(next); addEvent(`insert → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  // Direct out cycling
  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const vals = DIRECT_OPTIONS.map(o => o.value);
    const idx = vals.indexOf(directRef.current);
    const safeIdx = idx === -1 ? 0 : idx;
    if (key.rightArrow || key.downArrow) {
      directRef.current = vals[(safeIdx + 1) % vals.length];
      channel.setDirectOut(directRef.current);
    }
    if (key.leftArrow || key.upArrow) {
      directRef.current = vals[(safeIdx - 1 + vals.length) % vals.length];
      channel.setDirectOut(directRef.current);
    }
  }, { isActive: isEditing(ROW_DIRECT) });

  if (!isFocused) {
    const directStr = channel.directOut !== null ? `Out ${channel.directOut}` : 'Off';
    const insertStr = channel.insertEnabled ? ' [INSERT]' : '';
    return <Text dimColor>{`─ ROUTING ─${insertStr} Direct: ${directStr}`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="ROUTING" />
      <Toggle
        value={channel.insertEnabled} label="  Insert  "
        onLabel=" ON" offLabel="OFF" isFocused={isFocRow(ROW_INSERT)}
      />
      <EnumSelect
        value={channel.directOut} options={DIRECT_OPTIONS} label="Direct"
        isFocused={isFocRow(ROW_DIRECT)} isEditing={isEditing(ROW_DIRECT)}
      />
    </Box>
  );
};
