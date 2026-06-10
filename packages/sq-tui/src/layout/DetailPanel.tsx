import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Channel } from '@allen-heath-sq-tools/api';
import { FocusZone, DetailSection, SECTION_ORDER } from '../app';
import { FaderSection, FADER_ROW_COUNT } from '../sections/FaderSection';
import { PreampSection, PREAMP_ROW_COUNT } from '../sections/PreampSection';
import { HpfSection, HPF_ROW_COUNT } from '../sections/HpfSection';
import { GateSection, GATE_ROW_COUNT } from '../sections/GateSection';
import { CompSection, COMP_ROW_COUNT } from '../sections/CompSection';
import { DelaySection, DELAY_ROW_COUNT } from '../sections/DelaySection';
import { PeqSection, PEQ_ROW_COUNT } from '../sections/PeqSection';
import { RoutingSection, ROUTING_ROW_COUNT } from '../sections/RoutingSection';
import { SendsSection, SENDS_ROW_COUNT } from '../sections/SendsSection';
import { levelToDb, formatDb } from '../utils';

const ROW_COUNTS: Record<DetailSection, number> = {
  fader: FADER_ROW_COUNT,
  preamp: PREAMP_ROW_COUNT,
  hpf: HPF_ROW_COUNT,
  gate: GATE_ROW_COUNT,
  comp: COMP_ROW_COUNT,
  delay: DELAY_ROW_COUNT,
  peq: PEQ_ROW_COUNT,
  routing: ROUTING_ROW_COUNT,
  sends: SENDS_ROW_COUNT,
};

interface Props {
  channel: Channel | null;
  focusZone: FocusZone;
  section: DetailSection;
  sectionRow: number;
  editMode: boolean;
  onBack: () => void;
  onSectionChange: (s: DetailSection, row?: number) => void;
  onRowChange: (r: number) => void;
  onEditModeStart: () => void;
  onEditModeEnd: () => void;
  addEvent: (text: string) => void;
}

export const DetailPanel: React.FC<Props> = ({
  channel, focusZone, section, sectionRow, editMode,
  onBack, onSectionChange, onRowChange, onEditModeStart, onEditModeEnd, addEvent,
}) => {
  const isFocused = focusZone === 'detail';

  // Navigation within panel (section cycling, row up/down)
  useInput((input, key) => {
    const rowCount = ROW_COUNTS[section];

    if (key.leftArrow) { onBack(); return; }

    if (key.tab) {
      const idx = SECTION_ORDER.indexOf(section);
      if (key.shift) {
        onSectionChange(SECTION_ORDER[(idx - 1 + SECTION_ORDER.length) % SECTION_ORDER.length], 0);
      } else {
        onSectionChange(SECTION_ORDER[(idx + 1) % SECTION_ORDER.length], 0);
      }
      return;
    }

    if (key.downArrow) {
      const nextRow = sectionRow + 1;
      if (nextRow >= rowCount) {
        const idx = SECTION_ORDER.indexOf(section);
        onSectionChange(SECTION_ORDER[(idx + 1) % SECTION_ORDER.length], 0);
      } else {
        onRowChange(nextRow);
      }
      return;
    }

    if (key.upArrow) {
      const nextRow = sectionRow - 1;
      if (nextRow < 0) {
        const idx = SECTION_ORDER.indexOf(section);
        const prevSection = SECTION_ORDER[(idx - 1 + SECTION_ORDER.length) % SECTION_ORDER.length];
        onSectionChange(prevSection, ROW_COUNTS[prevSection] - 1);
      } else {
        onRowChange(nextRow);
      }
      return;
    }
  }, { isActive: isFocused && !editMode });

  if (!channel) {
    return (
      <Box flexGrow={1} borderStyle="single" borderColor="gray" justifyContent="center" alignItems="center">
        <Text dimColor>No channel selected</Text>
      </Box>
    );
  }

  const db = channel.level !== null ? levelToDb(channel.level) : null;
  const nameStr = channel.name ?? '------';
  const dbStr = db !== null ? `${db >= 0 ? '+' : ''}${db.toFixed(1)}dB` : '--';

  const commonProps = (s: DetailSection) => ({
    channel,
    isFocused: isFocused && section === s,
    selectedRow: sectionRow,
    editMode,
    onEditModeStart,
    onEditModeEnd,
    addEvent,
  });

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor={isFocused ? 'cyan' : 'gray'}>
      {/* Channel header */}
      <Box>
        <Text bold> CH </Text>
        <Text bold color="cyan">{nameStr.padEnd(6)}</Text>
        <Text>  </Text>
        <Text color={channel.muted ? 'red' : 'gray'}>[{channel.muted ? 'MUTED' : '     '}]</Text>
        <Text> </Text>
        <Text color={channel.paflOn ? 'yellow' : 'gray'}>[{channel.paflOn ? 'SOLO' : '    '}]</Text>
        <Text>  {dbStr.padStart(8)}</Text>
        {!isFocused && <Text dimColor>  → enter</Text>}
      </Box>

      {/* Sections */}
      <Box flexDirection="column">
        <FaderSection {...commonProps('fader')} />
        <PreampSection {...commonProps('preamp')} />
        <HpfSection {...commonProps('hpf')} />
        <GateSection {...commonProps('gate')} />
        <CompSection {...commonProps('comp')} />
        <DelaySection {...commonProps('delay')} />
        <PeqSection {...commonProps('peq')} />
        <RoutingSection {...commonProps('routing')} />
        <SendsSection {...commonProps('sends')} />
      </Box>
    </Box>
  );
};
