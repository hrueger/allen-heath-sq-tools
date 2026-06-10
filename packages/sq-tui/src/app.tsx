import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import { SQMixer, Channel, DspFrame, VersionInfo } from '@allen-heath-sq-tools/api';
import { Shell } from './layout/Shell';
import { ChannelList } from './layout/ChannelList';
import { DetailPanel } from './layout/DetailPanel';
import { MixerPage } from './sections/MixerPage';
import { nowStr } from './utils';

export type FocusZone = 'channels' | 'detail';
export type ChannelTypeName = 'inputs' | 'stereo' | 'fxReturns' | 'buses' | 'dcas' | 'main';
export type DetailSection = 'fader' | 'preamp' | 'hpf' | 'gate' | 'comp' | 'delay' | 'peq' | 'routing' | 'sends';

export const SECTION_ORDER: DetailSection[] = [
  'fader', 'preamp', 'hpf', 'gate', 'comp', 'delay', 'peq', 'routing', 'sends',
];

const HOST = process.env['SQ_HOST'] ?? '10.22.1.11';

const ALL_CHANNEL_EVENTS = [
  'level', 'mute', 'pan', 'gain', 'trim',
  'hpf-on', 'hpf-freq', 'hpf-slope',
  'gate-on', 'gate-threshold', 'gate-depth', 'gate-attack', 'gate-release', 'gate-hold',
  'comp-on', 'comp-threshold', 'comp-ratio', 'comp-gain',
  'pad-on', 'phantom-on', 'polarity-on',
  'delay-on', 'delay-duration',
  'peq-on',
  'peq-lf-gain', 'peq-lf-freq', 'peq-lf-q', 'peq-lf-shape',
  'peq-lm-gain', 'peq-lm-freq', 'peq-lm-q',
  'peq-hm-gain', 'peq-hm-freq', 'peq-hm-q',
  'peq-hf-gain', 'peq-hf-freq', 'peq-hf-q', 'peq-hf-shape',
  'direct-out', 'insert-enabled', 'pafl-on', 'name', 'send', 'send-fx',
];

export const App: React.FC = () => {
  const { exit } = useApp();
  const sqRef = useRef<SQMixer | null>(null);

  const channelsByType = useRef<Record<ChannelTypeName, Channel[]>>({
    inputs: [], stereo: [], fxReturns: [], buses: [], dcas: [], main: [],
  });

  const [tick, setTick] = useState(0);
  const forceRender = useCallback(() => setTick(v => v + 1), []);

  const [connected, setConnected] = useState(false);
  const [versionStr, setVersionStr] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<{ time: string; text: string }>>([
    { time: nowStr(), text: `Connecting to ${HOST}…` },
  ]);

  const [focusZone, setFocusZone] = useState<FocusZone>('channels');
  const [channelType, setChannelType] = useState<ChannelTypeName>('inputs');
  const [channelIndex, setChannelIndex] = useState(0);
  const [section, setSection] = useState<DetailSection>('fader');
  const [sectionRow, setSectionRow] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showMixer, setShowMixer] = useState(false);

  const addEvent = useCallback((text: string) => {
    setEvents(prev => [...prev.slice(-19), { time: nowStr(), text }]);
  }, []);

  useEffect(() => {
    const sq = new SQMixer({ host: HOST });
    sqRef.current = sq;

    sq.connect().then((vi: VersionInfo) => {
      setConnected(true);
      setVersionStr(`fw${vi.fwA}.${vi.fwB}`);
      addEvent(`Connected — SQ fw${vi.fwA}.${vi.fwB}`);

      channelsByType.current = {
        inputs: sq.inputs,
        stereo: sq.stereoInputs,
        fxReturns: sq.fxReturns,
        buses: sq.buses,
        dcas: sq.dcas,
        main: [sq.mainLR],
      };

      const allChannels: Channel[] = [
        ...sq.inputs, ...sq.stereoInputs, ...sq.fxReturns,
        ...sq.buses, ...sq.dcas, sq.mainLR,
      ];

      allChannels.forEach(ch => {
        ALL_CHANNEL_EVENTS.forEach(evt => ch.on(evt, forceRender));
      });

      sq.on('mute-group', (groupNumber: number, on: boolean) => {
        addEvent(`mute-group ${groupNumber} → ${on ? 'ON' : 'OFF'}`);
        forceRender();
      });

      sq.on('initialState', () => {
        forceRender();
        addEvent('Initial state loaded');
      });

      sq.conn.on('dsp', (d: DspFrame) => {
        // Uncomment for verbose DSP logging:
        // addEvent(`ch=0x${d.ch.toString(16).padStart(2,'0')} reg=0x${d.register.toString(16)}`);
      });

      forceRender();
    }).catch((err: Error) => {
      addEvent(`Connection failed: ${err.message}`);
    });

    sq.on('disconnect', () => {
      setConnected(false);
      addEvent('Disconnected');
    });
    sq.on('error', (e: Error) => addEvent(`Error: ${e.message}`));

    return () => { sq.disconnect(); };
  }, []);

  // Global keyboard handler
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) { exit(); return; }
    // When mixer page is open, it handles all keys itself (prevents m/n/etc leaking)
    if (showMixer) return;
    if (editMode) return;

    // Tab: cycle between channel list and detail panel
    if (key.tab) {
      if (focusZone === 'channels') {
        setFocusZone('detail');
        setSection('fader');
        setSectionRow(0);
        setEditMode(false);
      }
      // detail panel handles tab internally for section cycling
      return;
    }

    if (input === 'm') { setShowMixer(true); return; }

    const typeMap: Record<string, ChannelTypeName> = {
      '1': 'inputs', '2': 'stereo', '3': 'fxReturns',
      '4': 'buses', '5': 'dcas', '6': 'main',
    };
    if (typeMap[input]) {
      setChannelType(typeMap[input]);
      setChannelIndex(0);
      setFocusZone('channels');
    }
  });

  const channels = channelsByType.current[channelType];
  const selectedChannel = channels[Math.min(channelIndex, Math.max(0, channels.length - 1))] ?? null;

  const handleSectionChange = useCallback((s: DetailSection, row?: number) => {
    setSection(s);
    setSectionRow(row ?? 0);
  }, []);

  return (
    <Shell
      connected={connected}
      versionStr={versionStr}
      channelType={channelType}
      showMixer={showMixer}
      host={HOST}
      events={events}
    >
      <Box flexGrow={1}>
        <ChannelList
          channels={channels}
          selectedIndex={channelIndex}
          isFocused={focusZone === 'channels' && !showMixer}
          onSelect={setChannelIndex}
          onEnterDetail={() => {
            setFocusZone('detail');
            setSection('fader');
            setSectionRow(0);
            setEditMode(false);
          }}
        />
        {showMixer ? (
          <MixerPage
            sq={sqRef.current}
            isFocused={true}
            onBack={() => setShowMixer(false)}
            addEvent={addEvent}
          />
        ) : (
          <DetailPanel
            channel={selectedChannel}
            focusZone={focusZone}
            section={section}
            sectionRow={sectionRow}
            editMode={editMode}
            onBack={() => { setFocusZone('channels'); setEditMode(false); }}
            onSectionChange={handleSectionChange}
            onRowChange={setSectionRow}
            onEditModeStart={() => setEditMode(true)}
            onEditModeEnd={() => setEditMode(false)}
            addEvent={addEvent}
          />
        )}
      </Box>
    </Shell>
  );
};
