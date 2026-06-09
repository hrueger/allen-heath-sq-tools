import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { NumberInput } from '../widgets/NumberInput';
import { SectionProps } from './types';
import { formatDbUnit, formatMs, linearNorm } from '../utils';

const ROW_ON = 0;
const ROW_THR = 1;
const ROW_DEPTH = 2;
const ROW_ATTACK = 3;
const ROW_RELEASE = 4;
const ROW_HOLD = 5;
export const GATE_ROW_COUNT = 6;

export const GateSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isEditing = (row: number) => isFocused && editMode && selectedRow === row;
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_ON) {
        const next = !(channel.gateOn ?? false); channel.setGateOn(next); addEvent(`gate → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  const logNormMs = (v: number, min: number, max: number) =>
    linearNorm(Math.log(v), Math.log(min), Math.log(max));

  if (!isFocused) {
    const thrStr = channel.gateThreshold !== null ? `${channel.gateThreshold.toFixed(1)}dB` : '--';
    const onStr = channel.gateOn ? ' [ON ] ' : ' [OFF] ';
    return <Text dimColor>{`─ GATE ────${onStr}Thr: ${thrStr}`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="GATE" enabled={channel.gateOn} isFocused={isFocRow(ROW_ON)} />
      <NumberInput
        value={channel.gateThreshold} min={-128} max={127} step={1}
        label="Thresh" format={v => formatDbUnit(v)}
        isFocused={isFocRow(ROW_THR)} isEditing={isEditing(ROW_THR)}
        onChange={v => channel.setGateThreshold(v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={channel.gateDepth} min={0} max={60} step={1}
        label="Depth" format={v => formatDbUnit(v)}
        isFocused={isFocRow(ROW_DEPTH)} isEditing={isEditing(ROW_DEPTH)}
        onChange={v => channel.setGateDepth(v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={channel.gateAttack} min={0.05} max={300} step={5}
        label="Attack" format={formatMs}
        normalize={v => logNormMs(v, 0.05, 300)}
        isFocused={isFocRow(ROW_ATTACK)} isEditing={isEditing(ROW_ATTACK)}
        onChange={v => channel.setGateAttack(v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={channel.gateRelease} min={10} max={1000} step={20}
        label="Release" format={formatMs}
        normalize={v => logNormMs(v, 10, 1000)}
        isFocused={isFocRow(ROW_RELEASE)} isEditing={isEditing(ROW_RELEASE)}
        onChange={v => channel.setGateRelease(v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={channel.gateHold} min={10} max={5000} step={50}
        label="Hold" format={formatMs}
        normalize={v => logNormMs(v, 10, 5000)}
        isFocused={isFocRow(ROW_HOLD)} isEditing={isEditing(ROW_HOLD)}
        onChange={v => channel.setGateHold(v)} onEditEnd={onEditModeEnd}
      />
    </Box>
  );
};
