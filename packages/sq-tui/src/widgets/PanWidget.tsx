import React from 'react';
import { Text } from 'ink';
import { formatPan } from '../utils';

interface Props {
  value: number | null; // -1 to +1
  isFocused: boolean;
  isEditing: boolean;
}

export const PanWidget: React.FC<Props> = ({ value, isFocused, isEditing }) => {
  const pan = value ?? 0;
  const width = 20;
  const pos = Math.round(((pan + 1) / 2) * (width - 1));
  const chars = Array(width).fill('─');
  chars[width >> 1] = '┼'; // center mark
  chars[pos] = '●';
  const display = formatPan(pan).padStart(4);
  const bg = isEditing ? 'blue' : isFocused ? 'gray' : undefined;
  return (
    <Text backgroundColor={bg}>
      {`  Pan    [${chars.join('')}]${display}`}
    </Text>
  );
};
