import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { SQMixer } from 'sq-sdk';

interface Props {
  sq: SQMixer | null;
  isFocused: boolean;
  onBack: () => void;
  addEvent: (text: string) => void;
}

type MixerView = 'scenes' | 'muteGroups' | 'talkback';

const VIEWPORT = 22;

export const MixerPage: React.FC<Props> = ({ sq, isFocused, onBack, addEvent }) => {
  const [view, setView] = useState<MixerView>('scenes');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [viewStart, setViewStart] = useState(0);
  const [confirm, setConfirm] = useState<null | { action: string; scene: number }>(null);
  const [renaming, setRenaming] = useState(false);
  const [editingCrossfade, setEditingCrossfade] = useState(false);
  const [, forceRender] = useState(0);

  const renameBuf = useRef('');
  const crossfadeBuf = useRef(0);

  // Keep viewport in sync with selection
  useEffect(() => {
    setViewStart(vs => {
      if (sceneIdx < vs) return sceneIdx;
      if (sceneIdx >= vs + VIEWPORT) return sceneIdx - VIEWPORT + 1;
      return vs;
    });
  }, [sceneIdx]);

  // Re-render when mixer state changes
  useEffect(() => {
    if (!sq) return;
    const handler = () => forceRender(v => v + 1);
    sq.on('scene-name', handler);
    sq.on('scene-stored', handler);
    sq.on('mute-group', handler);
    sq.on('talkback-on', handler);
    sq.on('talkback-gain', handler);
    return () => {
      sq.off('scene-name', handler);
      sq.off('scene-stored', handler);
      sq.off('mute-group', handler);
      sq.off('talkback-on', handler);
      sq.off('talkback-gain', handler);
    };
  }, [sq]);

  const totalScenes = sq?.sceneStored.length ?? 300;

  useInput((input, key) => {
    if (renaming) {
      if (key.escape) { setRenaming(false); return; }
      if (key.return) {
        const name = renameBuf.current.trim();
        if (sq) {
          sq.renameScene(sceneIdx + 1, name);
          addEvent(`scene ${sceneIdx + 1} renamed → "${name}"`);
        }
        setRenaming(false);
        return;
      }
      if (key.backspace || key.delete) {
        renameBuf.current = renameBuf.current.slice(0, -1);
        forceRender(v => v + 1);
        return;
      }
      if (input && !key.ctrl && renameBuf.current.length < 16) {
        renameBuf.current += input;
        forceRender(v => v + 1);
      }
      return;
    }

    if (editingCrossfade) {
      if (key.escape || key.return) { setEditingCrossfade(false); return; }
      if (key.upArrow) {
        crossfadeBuf.current = Math.min(60000, crossfadeBuf.current + 500);
        sq?.setSceneCrossfadeMs(sceneIdx + 1, crossfadeBuf.current);
        forceRender(v => v + 1);
      }
      if (key.downArrow) {
        crossfadeBuf.current = Math.max(0, crossfadeBuf.current - 500);
        sq?.setSceneCrossfadeMs(sceneIdx + 1, crossfadeBuf.current);
        forceRender(v => v + 1);
      }
      return;
    }

    if (key.escape || key.leftArrow) { onBack(); return; }
    if (input === 's') { setView('scenes'); setConfirm(null); return; }
    if (input === 'g') { setView('muteGroups'); return; }
    if (input === 't') { setView('talkback'); return; }

    if (view === 'scenes') {
      if (key.upArrow)   { setSceneIdx(i => Math.max(0, i - 1)); setConfirm(null); }
      if (key.downArrow) { setSceneIdx(i => Math.min(totalScenes - 1, i + 1)); setConfirm(null); }

      if (key.return) {
        if (confirm?.scene === sceneIdx + 1) {
          if (confirm.action === 'recall') {
            sq?.recallScene(sceneIdx + 1);
            addEvent(`scene ${sceneIdx + 1} recalled`);
          } else if (confirm.action === 'store') {
            sq?.storeScene(sceneIdx + 1);
            addEvent(`scene ${sceneIdx + 1} stored`);
          } else if (confirm.action === 'd') {
            sq?.deleteScene(sceneIdx + 1);
            addEvent(`scene ${sceneIdx + 1} deleted`);
          }
          setConfirm(null);
        } else {
          setConfirm({ action: 'recall', scene: sceneIdx + 1 });
        }
      }
      if (input === 'w') { setConfirm({ action: 'store', scene: sceneIdx + 1 }); }
      if (input === 'd') { setConfirm({ action: 'd', scene: sceneIdx + 1 }); }
      if (input === 'n') {
        renameBuf.current = sq?.sceneNames[sceneIdx] ?? '';
        setRenaming(true);
        setConfirm(null);
      }
      if (input === 'f') {
        crossfadeBuf.current = sq?.sceneCrossfadeMs[sceneIdx] ?? 0;
        setEditingCrossfade(true);
        setConfirm(null);
      }
    }

    if (view === 'muteGroups') {
      const n = parseInt(input, 10);
      if (n >= 1 && n <= 8 && sq) {
        const on = sq.muteGroups[n - 1];
        sq.setMuteGroupOn(n, !on);
        addEvent(`mute group ${n} → ${!on ? 'ON' : 'OFF'}`);
      }
    }

    if (view === 'talkback') {
      if (key.return && sq) {
        const newOn = !(sq.talkbackOn ?? false);
        sq.setTalkbackOn(newOn);
        addEvent(`talkback → ${newOn ? 'ON' : 'OFF'}`);
      }
      if (key.upArrow && sq) {
        sq.setTalkbackGain(Math.min(40, (sq.talkbackGainDb ?? 0) + 1));
      }
      if (key.downArrow && sq) {
        sq.setTalkbackGain(Math.max(-20, (sq.talkbackGainDb ?? 0) - 1));
      }
    }
  }, { isActive: isFocused });

  const renderScenes = () => {
    const visibleIndices = Array.from({ length: VIEWPORT }, (_, j) => viewStart + j)
      .filter(i => i < totalScenes);

    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          {'  SCENES  (↑↓ select, Enter=recall, w=store, d=delete, n=rename, f=crossfade)'}
        </Text>
        {visibleIndices.map(i => {
          const sel = i === sceneIdx;
          const stored = sq?.sceneStored[i] ?? null;
          const name = sq?.sceneNames[i] ?? null;
          const cfMs = sq?.sceneCrossfadeMs[i] ?? null;
          const cfStr = cfMs !== null && cfMs > 0 ? `  ${(cfMs / 1000).toFixed(1)}s` : '';

          // Indicator: ● stored, ○ empty, ? unknown
          const dot = stored === true ? '●' : stored === false ? '○' : '?';
          const dotColor = stored === true ? 'green' : stored === false ? undefined : 'yellow';

          if (sel && renaming) {
            const buf = renameBuf.current.padEnd(16, ' ');
            return (
              <Box key={i}>
                <Text backgroundColor="blue"> {dot} </Text>
                <Text backgroundColor="blue">{`S${String(i + 1).padStart(3, ' ')}  `}</Text>
                <Text backgroundColor="cyan" color="black">{`[${buf}|]`}</Text>
              </Box>
            );
          }

          if (sel && editingCrossfade) {
            const ms = crossfadeBuf.current;
            return (
              <Box key={i}>
                <Text backgroundColor="blue"> {dot} </Text>
                <Text backgroundColor="blue">{`S${String(i + 1).padStart(3, ' ')}  `}</Text>
                <Text dimColor>{(name ?? '').padEnd(16, ' ')}</Text>
                <Text backgroundColor="cyan" color="black">{`  ↑↓ ${(ms / 1000).toFixed(1)}s  `}</Text>
              </Box>
            );
          }

          const nameDisplay = stored === true
            ? (name ? name.padEnd(16, ' ') : '<unnamed>       ')
            : stored === false
              ? '                ' // empty
              : '···             '; // unknown

          return (
            <Box key={i}>
              <Text
                backgroundColor={sel ? 'blue' : undefined}
                color={sel ? 'white' : dotColor}
                dimColor={!sel && stored === false}
              >
                {` ${dot} `}
              </Text>
              <Text
                backgroundColor={sel ? 'blue' : undefined}
                dimColor={!sel && stored !== true}
              >
                {`S${String(i + 1).padStart(3, ' ')}  `}
              </Text>
              <Text
                backgroundColor={sel ? 'blue' : undefined}
                dimColor={!sel && stored !== true}
              >
                {nameDisplay}
              </Text>
              {cfStr
                ? <Text backgroundColor={sel ? 'blue' : undefined} dimColor={!sel}>{cfStr}</Text>
                : null
              }
              {confirm?.scene === i + 1
                ? <Text color="yellow">{'  Confirm?'}</Text>
                : null
              }
            </Box>
          );
        })}
        {totalScenes > VIEWPORT && (
          <Text dimColor>{`  … ${totalScenes} total scenes, showing ${viewStart + 1}–${Math.min(viewStart + VIEWPORT, totalScenes)}`}</Text>
        )}
      </Box>
    );
  };

  const renderMuteGroups = () => (
    <Box flexDirection="column">
      <Text color="cyan" bold>  MUTE GROUPS  (press 1-8 to toggle)</Text>
      <Box flexDirection="row" flexWrap="wrap">
        {Array.from({ length: 8 }, (_, i) => {
          const on = sq?.muteGroups[i];
          return (
            <Text key={i} color={on ? 'red' : undefined} backgroundColor={on ? undefined : 'gray'}>
              {` [${i + 1}: ${on ? 'MUTED' : '     '}] `}
            </Text>
          );
        })}
      </Box>
    </Box>
  );

  const renderTalkback = () => {
    const tbOn = sq?.talkbackOn ?? null;
    const tbGain = sq?.talkbackGainDb ?? null;
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>  TALKBACK  (Enter=toggle on/off, ↑↓=gain)</Text>
        <Box>
          <Text>{'   On/Off  '}</Text>
          <Text backgroundColor={tbOn ? 'red' : 'gray'} color="white" bold>
            {tbOn === null ? ' --- ' : tbOn ? '  ON  ' : ' OFF  '}
          </Text>
        </Box>
        <Box>
          <Text>{'   Gain    '}</Text>
          <Text color="cyan">
            {tbGain === null
              ? '  --'
              : `  ${tbGain >= 0 ? '+' : ''}${tbGain.toFixed(1)} dB`
            }
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="cyan">
      <Box>
        <Text bold color="cyan"> MIXER  </Text>
        <Text backgroundColor={view === 'scenes' ? 'blue' : undefined}> [s]SCENES </Text>
        <Text backgroundColor={view === 'muteGroups' ? 'blue' : undefined}> [g]MUTE GROUPS </Text>
        <Text backgroundColor={view === 'talkback' ? 'blue' : undefined}> [t]TALKBACK </Text>
        <Text dimColor>  ← back</Text>
      </Box>
      {view === 'scenes' && renderScenes()}
      {view === 'muteGroups' && renderMuteGroups()}
      {view === 'talkback' && renderTalkback()}
    </Box>
  );
};
