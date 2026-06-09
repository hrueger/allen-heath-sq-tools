import React from 'react';
import { Text } from 'ink';

interface Props {
  value: boolean | null;
  label: string;
  onLabel?: string;
  offLabel?: string;
  isFocused: boolean;
}

export const Toggle: React.FC<Props> = ({ value, label, onLabel = 'ON ', offLabel = 'OFF', isFocused }) => {
  const on = value === true;
  const pill = on ? onLabel : offLabel;
  const pillColor = on ? 'green' : undefined;
  const bg = isFocused ? 'gray' : undefined;
  return (
    <Text backgroundColor={bg}>
      {label}
      <Text color="white" backgroundColor={pillColor}>{`[${pill}]`}</Text>
    </Text>
  );
};

/** Compact inline toggle used in preamp section. */
export const InlineToggle: React.FC<Props> = ({ value, label, onLabel, offLabel = 'OFF', isFocused }) => {
  const on = value === true;
  const pill = on ? (onLabel ?? 'ON ') : offLabel;
  const bg = isFocused ? 'gray' : undefined;
  const pillColor = on ? 'green' : undefined;
  return (
    <Text backgroundColor={bg}> {label}:<Text backgroundColor={pillColor}>[{pill}]</Text></Text>
  );
};
