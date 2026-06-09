import React from 'react';
import { Text } from 'ink';

interface Props<T> {
  value: T | null;
  options: Array<{ value: T; label: string }>;
  label: string;
  isFocused: boolean;
  isEditing: boolean;
}

export function EnumSelect<T>({ value, options, label, isFocused, isEditing }: Props<T>): React.ReactElement {
  const current = options.find(o => o.value === value);
  const display = current?.label ?? (value === null ? 'Off' : String(value));
  const bg = isEditing ? 'blue' : isFocused ? 'gray' : undefined;
  const labelPad = label.padEnd(8);
  const inner = isEditing ? `< ${display.padEnd(10)} >` : `  ${display.padEnd(10)}  `;
  return (
    <Text backgroundColor={bg}>
      {`  ${labelPad}[${inner}]`}
    </Text>
  );
}
