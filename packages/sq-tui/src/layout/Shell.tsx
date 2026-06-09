import React from 'react';
import { Box, Text } from 'ink';
import { ChannelTypeName } from '../app';

interface Props {
  connected: boolean;
  versionStr: string | null;
  channelType: ChannelTypeName;
  showMixer: boolean;
  host: string;
  events: Array<{ time: string; text: string }>;
  children: React.ReactNode;
}

const TYPE_LABELS: Record<ChannelTypeName, string> = {
  inputs: '1:INPUTS',
  stereo: '2:STEREO',
  fxReturns: '3:FX RET',
  buses: '4:BUSES',
  dcas: '5:DCAS',
  main: '6:MAIN',
};

export const Shell: React.FC<Props> = ({ connected, versionStr, channelType, showMixer, host, events, children }) => {
  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text bold color="white" backgroundColor="blue"> SQ MIXER </Text>
        <Text> </Text>
        {(Object.keys(TYPE_LABELS) as ChannelTypeName[]).map(t => (
          <Text
            key={t}
            bold={!showMixer && channelType === t}
            color={!showMixer && channelType === t ? 'black' : 'white'}
            backgroundColor={!showMixer && channelType === t ? 'cyan' : 'blue'}
          >
            {` ${TYPE_LABELS[t]} `}
          </Text>
        ))}
        <Text
          bold={showMixer}
          color={showMixer ? 'black' : 'white'}
          backgroundColor={showMixer ? 'cyan' : 'blue'}
        >
          {' M:MIXER '}
        </Text>
        <Text> </Text>
        <Text color={connected ? 'green' : 'red'}>
          {connected ? '● ' : '○ '}{connected ? (versionStr ?? 'Connected') : 'Disconnected'}
        </Text>
        <Text dimColor>  {host}  q:quit  Tab:nav</Text>
      </Box>

      {/* Main content */}
      <Box flexGrow={1}>
        {children}
      </Box>

      {/* Event log */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray">
        {events.slice(-3).map((e, i) => (
          <Text key={i} dimColor>{e.time} {e.text}</Text>
        ))}
      </Box>
    </Box>
  );
};
