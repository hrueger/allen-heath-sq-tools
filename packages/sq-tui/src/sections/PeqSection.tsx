import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SectionHeader } from '../widgets/SectionHeader';
import { NumberInput } from '../widgets/NumberInput';
import { EnumSelect } from '../widgets/EnumSelect';
import { SectionProps } from './types';
import { formatDbUnit, formatHz, linearNorm } from '../utils';

// Row layout: 0=on, 1-4=LF, 5-7=LM, 8-10=HM, 11-14=HF
const ROW_ON = 0;
const ROW_LF_GAIN = 1; const ROW_LF_FREQ = 2; const ROW_LF_Q = 3; const ROW_LF_SHAPE = 4;
const ROW_LM_GAIN = 5; const ROW_LM_FREQ = 6; const ROW_LM_Q = 7;
const ROW_HM_GAIN = 8; const ROW_HM_FREQ = 9; const ROW_HM_Q = 10;
const ROW_HF_GAIN = 11; const ROW_HF_FREQ = 12; const ROW_HF_Q = 13; const ROW_HF_SHAPE = 14;
export const PEQ_ROW_COUNT = 15;

const SHAPE_OPTIONS = [
  { value: 0, label: 'Peak  ' },
  { value: 6, label: 'Shelf ' },
  { value: 11, label: 'HiPass' },
];

type Band = 'lf' | 'lm' | 'hm' | 'hf';

interface BandRowProps {
  channel: React.ComponentProps<typeof PeqSection>['channel'];
  band: Band;
  selectedRow: number;
  bandRows: { gain: number; freq: number; q: number; shape?: number };
  isFocused: boolean;
  editMode: boolean;
  onEditModeEnd: () => void;
  onChange: (param: string, v: number) => void;
}

const BAND_RANGES: Record<Band, { minFreq: number; maxFreq: number }> = {
  lf: { minFreq: 20, maxFreq: 500 },
  lm: { minFreq: 100, maxFreq: 2000 },
  hm: { minFreq: 500, maxFreq: 5000 },
  hf: { minFreq: 2000, maxFreq: 20000 },
};

const BandRow: React.FC<BandRowProps> = ({ channel, band, selectedRow, bandRows, isFocused, editMode, onEditModeEnd, onChange }) => {
  const { minFreq, maxFreq } = BAND_RANGES[band];
  const gain = (channel as any)[`peq${band.charAt(0).toUpperCase() + band.slice(1)}Gain`] as number | null;
  const freq = (channel as any)[`peq${band.charAt(0).toUpperCase() + band.slice(1)}Freq`] as number | null;
  const q = (channel as any)[`peq${band.charAt(0).toUpperCase() + band.slice(1)}Q`] as number | null;
  const shape = band === 'lf' || band === 'hf'
    ? ((channel as any)[`peq${band.charAt(0).toUpperCase() + band.slice(1)}Shape`] as number | null)
    : undefined;

  // Shape cycling ref
  const shapeRef = React.useRef<number>(shape ?? 0);
  useInput((input, key) => {
    if (key.escape || key.return) { onEditModeEnd(); return; }
    const vals = SHAPE_OPTIONS.map(o => o.value);
    const idx = vals.indexOf(shapeRef.current);
    if (key.rightArrow || key.downArrow) {
      shapeRef.current = vals[(idx + 1) % vals.length];
      onChange('shape', shapeRef.current);
    }
    if (key.leftArrow || key.upArrow) {
      shapeRef.current = vals[(idx - 1 + vals.length) % vals.length];
      onChange('shape', shapeRef.current);
    }
  }, { isActive: isFocused && editMode && selectedRow === bandRows.shape });

  const label = band.toUpperCase();

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>{`  ${label}:`}</Text>
      <NumberInput
        value={gain} min={-12} max={12} step={0.5}
        label="  Gain" format={v => formatDbUnit(v)}
        normalize={v => linearNorm(v, -12, 12)}
        isFocused={isFocused && selectedRow === bandRows.gain}
        isEditing={isFocused && editMode && selectedRow === bandRows.gain}
        onChange={v => onChange('gain', v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={freq} min={minFreq} max={maxFreq} step={Math.round(maxFreq / 100)}
        label="  Freq" format={formatHz}
        normalize={v => linearNorm(Math.log10(v), Math.log10(minFreq), Math.log10(maxFreq))}
        isFocused={isFocused && selectedRow === bandRows.freq}
        isEditing={isFocused && editMode && selectedRow === bandRows.freq}
        onChange={v => onChange('freq', v)} onEditEnd={onEditModeEnd}
      />
      <NumberInput
        value={q} min={0.1} max={10} step={0.1}
        label="  Q   " format={v => v.toFixed(2)}
        normalize={v => linearNorm(Math.log10(v), Math.log10(0.1), Math.log10(10))}
        isFocused={isFocused && selectedRow === bandRows.q}
        isEditing={isFocused && editMode && selectedRow === bandRows.q}
        onChange={v => onChange('q', v)} onEditEnd={onEditModeEnd}
      />
      {bandRows.shape !== undefined && (
        <EnumSelect
          value={shape} options={SHAPE_OPTIONS} label="  Shape"
          isFocused={isFocused && selectedRow === bandRows.shape}
          isEditing={isFocused && editMode && selectedRow === bandRows.shape}
        />
      )}
    </Box>
  );
};

type SetterKey = `setPeq${'Lf' | 'Lm' | 'Hm' | 'Hf'}${'Gain' | 'Freq' | 'Q' | 'Shape'}`;

export const PeqSection: React.FC<SectionProps> = ({
  channel, isFocused, selectedRow, editMode, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isFocRow = (row: number) => isFocused && selectedRow === row;

  useInput((input, key) => {
    if (key.return || input === ' ') {
      if (selectedRow === ROW_ON) {
        const next = !(channel.peqOn ?? false); channel.setPeqOn(next); addEvent(`peq → ${next ? 'ON' : 'OFF'}`);
      } else {
        onEditModeStart();
      }
    }
  }, { isActive: isFocused && !editMode });

  const makeSetter = (band: 'Lf' | 'Lm' | 'Hm' | 'Hf') => (param: string, v: number) => {
    const setter = `setPeq${band}${param.charAt(0).toUpperCase() + param.slice(1)}` as SetterKey;
    (channel as any)[setter]?.(v);
  };

  if (!isFocused) {
    const onStr = channel.peqOn ? ' [ON ] ' : ' [OFF] ';
    return <Text dimColor>{`─ PEQ ─────${onStr}LF/LM/HM/HF`}</Text>;
  }

  return (
    <Box flexDirection="column">
      <SectionHeader label="PEQ" enabled={channel.peqOn} isFocused={isFocRow(ROW_ON)} />
      <BandRow
        channel={channel} band="lf"
        selectedRow={selectedRow}
        bandRows={{ gain: ROW_LF_GAIN, freq: ROW_LF_FREQ, q: ROW_LF_Q, shape: ROW_LF_SHAPE }}
        isFocused={isFocused} editMode={editMode} onEditModeEnd={onEditModeEnd}
        onChange={makeSetter('Lf')}
      />
      <BandRow
        channel={channel} band="lm"
        selectedRow={selectedRow}
        bandRows={{ gain: ROW_LM_GAIN, freq: ROW_LM_FREQ, q: ROW_LM_Q }}
        isFocused={isFocused} editMode={editMode} onEditModeEnd={onEditModeEnd}
        onChange={makeSetter('Lm')}
      />
      <BandRow
        channel={channel} band="hm"
        selectedRow={selectedRow}
        bandRows={{ gain: ROW_HM_GAIN, freq: ROW_HM_FREQ, q: ROW_HM_Q }}
        isFocused={isFocused} editMode={editMode} onEditModeEnd={onEditModeEnd}
        onChange={makeSetter('Hm')}
      />
      <BandRow
        channel={channel} band="hf"
        selectedRow={selectedRow}
        bandRows={{ gain: ROW_HF_GAIN, freq: ROW_HF_FREQ, q: ROW_HF_Q, shape: ROW_HF_SHAPE }}
        isFocused={isFocused} editMode={editMode} onEditModeEnd={onEditModeEnd}
        onChange={makeSetter('Hf')}
      />
    </Box>
  );
};
