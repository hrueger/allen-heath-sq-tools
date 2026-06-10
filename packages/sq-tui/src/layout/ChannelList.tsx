import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Channel } from '@allen-heath-sq-tools/api';
import { formatDb, formatPan } from '../utils';

interface Props {
  channels: Channel[];
  selectedIndex: number;
  isFocused: boolean;
  onSelect: (i: number) => void;
  onEnterDetail: () => void;
}

const LIST_WIDTH = 26;
const VISIBLE_ROWS = 30;

function formatChannelRow(ch: Channel, i: number): { num: string; name: string; level: string; mute: string; pan: string } {
  const num = String(i + 1).padStart(2, ' ');
  const name = (ch.name ?? '------').padEnd(6).slice(0, 6);
  const db = ch.level;
  const level = (db !== null ? `${formatDb(db)}dB` : '--').padStart(7);
  const mute = ch.muted ? 'M' : '·';
  const pan = (ch.pan !== null ? formatPan(ch.pan) : '?').padStart(4);
  return { num, name, level, mute, pan };
}

export const ChannelList: React.FC<Props> = ({ channels, selectedIndex, isFocused, onSelect, onEnterDetail }) => {
  const windowStart = Math.max(0, Math.min(selectedIndex - Math.floor(VISIBLE_ROWS / 2), channels.length - VISIBLE_ROWS));

  useInput((input, key) => {
    if (key.upArrow) onSelect(Math.max(0, selectedIndex - 1));
    if (key.downArrow) onSelect(Math.min(channels.length - 1, selectedIndex + 1));
    if (key.pageUp) onSelect(Math.max(0, selectedIndex - 10));
    if (key.pageDown) onSelect(Math.min(channels.length - 1, selectedIndex + 10));
    if (key.rightArrow || key.return) onEnterDetail();
  }, { isActive: isFocused });

  const visible = channels.slice(windowStart, windowStart + VISIBLE_ROWS);

  return (
    <Box flexDirection="column" width={LIST_WIDTH} borderStyle="single" borderColor={isFocused ? 'cyan' : 'gray'}>
      <Text bold color="cyan">{' # Name   Level  M Pan'}</Text>
      {visible.map((ch, vi) => {
        const gi = vi + windowStart;
        const sel = gi === selectedIndex;
        const { num, name, level, mute, pan } = formatChannelRow(ch, gi);
        const bg = sel ? (isFocused ? 'blue' : 'gray') : undefined;
        return (
          <Text key={gi} backgroundColor={bg}>
            {sel ? '►' : ' '}{num}{' '}{name}{level}{' '}{mute}{' '}{pan}
          </Text>
        );
      })}
      {channels.length === 0 && <Text dimColor>  Connecting…</Text>}
    </Box>
  );
};
