import React from 'react';
import { Text } from 'ink';
import { bar } from '../utils';

interface Props {
  normalized: number | null; // 0-1
  label: string;
  display: string;           // formatted value string
  width?: number;
  isFocused: boolean;
  isEditing: boolean;
}

export const FaderBar: React.FC<Props> = ({ normalized, label, display, width = 16, isFocused, isEditing }) => {
  const filled = bar(normalized ?? 0, width);
  const bg = isEditing ? 'blue' : isFocused ? 'gray' : undefined;
  const labelPad = label.padEnd(6);
  return (
    <Text backgroundColor={bg}>
      {`  ${labelPad} [`}{filled}{`] `}{display.padStart(8)}
    </Text>
  );
};
