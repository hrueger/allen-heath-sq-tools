import React from 'react';
import { Box, Text, useInput } from 'ink';
import { faderToDb } from 'sq-sdk';
import { SectionHeader } from '../widgets/SectionHeader';
import { FaderBar } from '../widgets/FaderBar';
import { SectionProps } from './types';
import { formatDb, clamp } from '../utils';

// Rows 0-11: Bus 1-12, Rows 12-15: FX 1-4
export const SENDS_ROW_COUNT = 16;

const BUS_STEPS = 0.02;
const FX_STEPS = 0.02;

function formatSend(v: number): string {
  if (v <= 0) return '-∞dB';
  const db = faderToDb(v);
  return `${formatDb(db)}dB`;
}

export const SendsSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  const sendRef = React.useRef<number>(0);

  useInput((input, key) => {
    if (key.return || input === ' ') onEditModeStart();
  }, { isActive: isFocused && !editMode });

  // Find current row's bus/fx
  const isBusRow = selectedRow <= 11;
  const busNum = selectedRow + 1;
  const fxNum = selectedRow - 11;

  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const dir = key.upArrow ? 1 : key.downArrow ? -1 : 0;
    if (dir !== 0) {
      sendRef.current = clamp(sendRef.current + dir * BUS_STEPS, 0, 1);
      if (isBusRow) {
        channel.setSend(busNum, sendRef.current);
      } else {
        channel.setSendFx(fxNum, sendRef.current);
      }
    }
  }, { isActive: isFocused && editMode });

  // Initialize ref when edit starts
  React.useEffect(() => {
    if (editMode && isBusRow) sendRef.current = channel.sends.get(busNum) ?? 0;
    if (editMode && !isBusRow) sendRef.current = channel.fxSends.get(fxNum) ?? 0;
  }, [editMode, selectedRow]);

  if (!isFocused) {
    const activeSends = Array.from(channel.sends.entries()).filter(([, v]) => v > 0).length;
    return <Text dimColor>{`─ SENDS ─── ${activeSends} active bus sends`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="SENDS" />
      <Text color="cyan"> Bus sends:</Text>
      {Array.from({ length: 12 }, (_, i) => {
        const bus = i + 1;
        const row = i;
        const v = channel.sends.get(bus) ?? 0;
        return (
          <FaderBar
            key={bus}
            normalized={v}
            label={`B${bus}`}
            display={formatSend(v)}
            width={12}
            isFocused={isFocRow(row)}
            isEditing={isEditing(row)}
          />
        );
      })}
      <Text color="cyan"> FX sends:</Text>
      {Array.from({ length: 4 }, (_, i) => {
        const fx = i + 1;
        const row = i + 12;
        const v = channel.fxSends.get(fx) ?? 0;
        return (
          <FaderBar
            key={fx}
            normalized={v}
            label={`FX${fx}`}
            display={formatSend(v)}
            width={12}
            isFocused={isFocRow(row)}
            isEditing={isEditing(row)}
          />
        );
      })}
    </Box>
  );
};
