import React from 'react';
import { Box, Text, useInput } from 'ink';
import { dbToFader } from '@allen-heath-sq-tools/api';
import { SectionHeader } from '../widgets/SectionHeader';
import { FaderBar } from '../widgets/FaderBar';
import { SectionProps } from './types';
import { formatDb, clamp } from '../utils';

// Rows 0-11: Bus 1-12, Rows 12-15: FX 1-4
export const SENDS_ROW_COUNT = 16;

const SEND_STEP_DB = 1;

function formatSend(db: number): string {
  if (!isFinite(db)) return '-∞dB';
  return `${formatDb(db)}dB`;
}

export const SendsSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  const sendRef = React.useRef<number>(-Infinity);

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
      const cur = isFinite(sendRef.current) ? sendRef.current : -90;
      sendRef.current = clamp(cur + dir * SEND_STEP_DB, -90, 10);
      if (isBusRow) {
        channel.setSend(busNum, sendRef.current);
      } else {
        channel.setSendFx(fxNum, sendRef.current);
      }
    }
  }, { isActive: isFocused && editMode });

  // Initialize ref when edit starts
  React.useEffect(() => {
    if (editMode && isBusRow) sendRef.current = channel.sends.get(busNum) ?? -Infinity;
    if (editMode && !isBusRow) sendRef.current = channel.fxSends.get(fxNum) ?? -Infinity;
  }, [editMode, selectedRow]);

  if (!isFocused) {
    const activeSends = Array.from(channel.sends.entries()).filter(([, v]: [number, number]) => v > 0).length;
    return <Text dimColor>{`─ SENDS ─── ${activeSends} active bus sends`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="SENDS" />
      <Text color="cyan"> Bus sends:</Text>
      {Array.from({ length: 12 }, (_, i) => {
        const bus = i + 1;
        const row = i;
        const v = channel.sends.get(bus) ?? -Infinity;
        return (
          <FaderBar
            key={bus}
            normalized={dbToFader(v)}
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
        const v = channel.fxSends.get(fx) ?? -Infinity;
        return (
          <FaderBar
            key={fx}
            normalized={dbToFader(v)}
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
