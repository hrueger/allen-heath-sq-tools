import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Channel } from '@allen-heath-sq-tools/api';
import { SectionHeader } from '../widgets/SectionHeader';
import { FaderBar } from '../widgets/FaderBar';
import { PanWidget } from '../widgets/PanWidget';
import { Toggle } from '../widgets/Toggle';
import { TextInput } from '../widgets/TextInput';
import { ColorPicker } from '../widgets/ColorPicker';
import { SectionProps } from './types';
import { levelNorm, formatDbUnit, clamp } from '../utils';

// Row indices
const ROW_NAME = 0;
const ROW_COLOR = 1;
const ROW_LEVEL = 2;
const ROW_PAN = 3;
const ROW_MUTE = 4;
const ROW_PAFL = 5;
export const FADER_ROW_COUNT = 6;

// Toggle rows that don't need editMode
const TOGGLE_ROWS = new Set([ROW_MUTE, ROW_PAFL]);

export const FaderSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  // Handle enter for non-toggle rows → signal edit mode start
  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (TOGGLE_ROWS.has(selectedRow)) {
        if (selectedRow === ROW_MUTE) {
          const next = !(channel.muted ?? false);
          channel.setMute(next);
          addEvent(`mute → ${next ? 'ON' : 'OFF'}`);
        } else if (selectedRow === ROW_PAFL) {
          const next = !(channel.paflOn ?? false);
          channel.setPaflOn(next);
          addEvent(`pafl → ${next ? 'ON' : 'OFF'}`);
        }
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  // Level editing — channel.level is dB
  const levelRef = React.useRef<number>(-Infinity);
  React.useEffect(() => {
    if (isEditing(ROW_LEVEL) && channel.level !== null) {
      levelRef.current = isFinite(channel.level) ? channel.level : -90;
    }
  }, [isEditing(ROW_LEVEL)]);

  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const dir = key.upArrow ? 1 : key.downArrow ? -1 : 0;
    if (dir !== 0) {
      levelRef.current = clamp(levelRef.current + dir * 1, -90, 10);
      channel.setLevel(levelRef.current);
    }
  }, { isActive: isEditing(ROW_LEVEL) });

  // Pan editing
  const panRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (isEditing(ROW_PAN)) panRef.current = channel.pan ?? 0;
  }, [isEditing(ROW_PAN)]);

  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const dir = key.rightArrow ? 1 : key.leftArrow ? -1 : 0;
    if (dir !== 0) {
      panRef.current = clamp(panRef.current + dir * 0.05, -1, 1);
      channel.setPan(panRef.current);
    }
  }, { isActive: isEditing(ROW_PAN) });

  const db = channel.level;
  const dbStr = db !== null ? formatDbUnit(isFinite(db) ? db : -90) : '--';
  const norm = db !== null ? levelNorm(db) : null;

  if (!isFocused) {
    const nameStr = channel.name ? channel.name.padEnd(6) : '------';
    const levelStr = db !== null ? formatDbUnit(isFinite(db) ? db : -90) : '--';
    return (
      <Text dimColor>
        {'─ FADER ─── '}{nameStr}{'  '}{levelStr.padStart(8)}{' '}
        {channel.muted ? '[MUTED]' : '       '}
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="FADER" />
      <TextInput
        value={channel.name}
        label="Name"
        maxLen={6}
        isFocused={isFocRow(ROW_NAME)}
        isEditing={isEditing(ROW_NAME)}
        onCommit={v => { channel.setName(v); addEvent(`name → "${v}"`); }}
        onEditEnd={onEditModeEnd}
      />
      <ColorPicker
        isFocused={isFocRow(ROW_COLOR)}
        isEditing={isEditing(ROW_COLOR)}
        onCommit={(r, g, b) => { channel.setColor(r, g, b); addEvent(`color → rgb(${r},${g},${b})`); }}
        onEditEnd={onEditModeEnd}
      />
      <FaderBar
        normalized={norm}
        label="Level"
        display={dbStr}
        isFocused={isFocRow(ROW_LEVEL)}
        isEditing={isEditing(ROW_LEVEL)}
      />
      <PanWidget
        value={channel.pan}
        isFocused={isFocRow(ROW_PAN)}
        isEditing={isEditing(ROW_PAN)}
      />
      <Box>
        <Toggle
          value={channel.muted}
          label="  Mute  "
          onLabel="MUTED"
          offLabel=" --- "
          isFocused={isFocRow(ROW_MUTE)}
        />
        <Text>  </Text>
        <Toggle
          value={channel.paflOn}
          label="Solo "
          onLabel="PAFL"
          offLabel="    "
          isFocused={isFocRow(ROW_PAFL)}
        />
      </Box>
    </Box>
  );
};
