import React from 'react';
import { Text } from 'ink';

interface Props {
  label: string;
  enabled?: boolean | null; // undefined means no toggle
  isFocused?: boolean;      // true if the toggle row itself is focused
  totalWidth?: number;
}

export const SectionHeader: React.FC<Props> = ({ label, enabled, isFocused, totalWidth = 54 }) => {
  const hasToggle = enabled !== undefined;
  const toggleStr = hasToggle
    ? (enabled ? ' [ON ] ' : ' [OFF] ')
    : '';
  const toggleLen = toggleStr.length;
  const dashesTotal = totalWidth - 2 - label.length - toggleLen;
  const dashesLeft = 1;
  const dashesRight = Math.max(0, dashesTotal - dashesLeft);
  const line = `${'─'.repeat(dashesLeft)} ${label} ${'─'.repeat(dashesRight)}${toggleStr}`;

  const bg = isFocused ? 'gray' : undefined;
  const toggleColor = hasToggle ? (enabled ? 'green' : 'red') : undefined;

  if (!hasToggle) {
    return <Text bold color="cyan">{line}</Text>;
  }

  // Split rendering: dashes + label in cyan, toggle colored
  const prefixLen = line.length - toggleStr.length;
  const prefix = line.slice(0, prefixLen);
  const suffix = line.slice(prefixLen);
  return (
    <Text backgroundColor={bg}>
      <Text bold color="cyan">{prefix}</Text>
      <Text color={toggleColor}>{suffix}</Text>
    </Text>
  );
};
